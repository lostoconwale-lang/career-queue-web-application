import "server-only";
import { Types } from "mongoose";

import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { mediaUrl } from "@/lib/media";
import { Company, type CompanyHydrated } from "@/lib/models/company.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import type {
  CreateCompanyBody,
  ListCompaniesQuery,
  UpdateCompanyBody,
} from "@/lib/validators/company.validator";
import type { CursorPage } from "@/types/api";
import type { CompanyDTO } from "@/types/company";

export function toCompanyDTO(c: CompanyHydrated): CompanyDTO {
  return {
    id: c._id.toString(),
    name: c.name,
    description: c.description,
    website: c.website,
    logo: c.logo
      ? {
          id: c.logo._id.toString(),
          key: c.logo.key,
          url: mediaUrl(c.logo.key),
        }
      : null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function getCompanyById(id: string): Promise<CompanyDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Company");
  const doc = await Company.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Company");
  return toCompanyDTO(doc);
}

export async function listCompanies(query: ListCompaniesQuery): Promise<CursorPage<CompanyDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await Company.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toCompanyDTO), query.limit);
}

export async function createCompany(body: CreateCompanyBody): Promise<CompanyDTO> {
  if (await Company.exists({ name: body.name, isDeleted: false })) {
    throw new ConflictError("A company with this name already exists");
  }
  const doc = await Company.create({
    name: body.name,
    description: body.description,
    website: body.website,
    logo: body.logo ?? null,
  });
  return toCompanyDTO(doc);
}

export async function updateCompany(id: string, patch: UpdateCompanyBody): Promise<CompanyDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Company");
  const doc = await Company.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Company");

  if (patch.name !== undefined && patch.name !== doc.name) {
    if (await Company.exists({ name: patch.name, isDeleted: false, _id: { $ne: doc._id } })) {
      throw new ConflictError("A company with this name already exists");
    }
    doc.name = patch.name;
  }
  if (patch.description !== undefined) doc.description = patch.description;
  if (patch.website !== undefined) doc.website = patch.website;
  if (patch.logo !== undefined) doc.set("logo", patch.logo);
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;

  await doc.save();
  return toCompanyDTO(doc);
}

export async function deleteCompany(id: string): Promise<CompanyDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Company");
  const doc = await Company.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Company");

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();
  return toCompanyDTO(doc);
}
