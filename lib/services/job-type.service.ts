import "server-only";
import { Types } from "mongoose";

import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { normalizeSearchText } from "@/lib/models/searchable";
import { JobType, type JobTypeHydrated } from "@/lib/models/job-type.model";
import type {
  CreateJobTypeBody,
  ListJobTypesQuery,
  UpdateJobTypeBody,
} from "@/lib/validators/job-type.validator";
import type { CursorPage } from "@/types/api";
import type { JobTypeDTO } from "@/types/job-type";

export function toJobTypeDTO(t: JobTypeHydrated): JobTypeDTO {
  return {
    id: t._id.toString(),
    name: t.name,
    description: t.description,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function getJobTypeById(id: string): Promise<JobTypeDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Job type");
  const doc = await JobType.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Job type");
  return toJobTypeDTO(doc);
}

export async function listJobTypes(query: ListJobTypesQuery): Promise<CursorPage<JobTypeDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await JobType.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toJobTypeDTO), query.limit);
}

export async function createJobType(body: CreateJobTypeBody): Promise<JobTypeDTO> {
  if (await JobType.exists({ name: body.name, isDeleted: false })) {
    throw new ConflictError("A job type with this name already exists");
  }
  const doc = await JobType.create({ name: body.name, description: body.description });
  return toJobTypeDTO(doc);
}

export async function updateJobType(id: string, patch: UpdateJobTypeBody): Promise<JobTypeDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Job type");
  const doc = await JobType.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Job type");

  if (patch.name !== undefined && patch.name !== doc.name) {
    if (await JobType.exists({ name: patch.name, isDeleted: false, _id: { $ne: doc._id } })) {
      throw new ConflictError("A job type with this name already exists");
    }
    doc.name = patch.name;
  }
  if (patch.description !== undefined) doc.description = patch.description;
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;

  await doc.save();
  return toJobTypeDTO(doc);
}

export async function deleteJobType(id: string): Promise<JobTypeDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Job type");
  const doc = await JobType.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Job type");

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();
  return toJobTypeDTO(doc);
}
