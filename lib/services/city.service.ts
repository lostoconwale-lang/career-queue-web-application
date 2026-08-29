import "server-only";
import { Types } from "mongoose";

import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { City, type CityHydrated } from "@/lib/models/city.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import type {
  CreateCityBody,
  ListCitiesQuery,
  UpdateCityBody,
} from "@/lib/validators/city.validator";
import type { CursorPage } from "@/types/api";
import type { CityDTO } from "@/types/city";

export function toCityDTO(c: CityHydrated): CityDTO {
  return {
    id: c._id.toString(),
    name: c.name,
    seo: {
      metaTitle: c.seo.metaTitle,
      metaDescription: c.seo.metaDescription,
      metaKeywords: [...c.seo.metaKeywords],
      ogImage: c.seo.ogImage,
    },
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function listCities(query: ListCitiesQuery): Promise<CursorPage<CityDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await City.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toCityDTO), query.limit);
}

export async function createCity(body: CreateCityBody): Promise<CityDTO> {
  if (await City.exists({ name: body.name, isDeleted: false })) {
    throw new ConflictError("A city with this name already exists");
  }
  const doc = await City.create({ name: body.name, seo: body.seo });
  return toCityDTO(doc);
}

export async function updateCity(id: string, patch: UpdateCityBody): Promise<CityDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("City");
  const doc = await City.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("City");

  if (patch.name !== undefined && patch.name !== doc.name) {
    if (await City.exists({ name: patch.name, isDeleted: false, _id: { $ne: doc._id } })) {
      throw new ConflictError("A city with this name already exists");
    }
    doc.name = patch.name;
  }
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;
  if (patch.seo !== undefined) doc.seo = patch.seo;

  await doc.save();
  return toCityDTO(doc);
}

export async function deleteCity(id: string): Promise<CityDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("City");
  const doc = await City.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("City");

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();
  return toCityDTO(doc);
}
