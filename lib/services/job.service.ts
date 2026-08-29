import "server-only";
import { Types } from "mongoose";

import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { mediaUrl } from "@/lib/media";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Category } from "@/lib/models/category.model";
import { JobType } from "@/lib/models/job-type.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import {
  Job,
  type JobHydrated,
  type JobCategory,
  type JobTypeSnapshot,
} from "@/lib/models/job.model";
import type { CreateJobBody, ListJobsQuery, UpdateJobBody } from "@/lib/validators/job.validator";
import type { CursorPage } from "@/types/api";
import type { EmbeddedMedia } from "@/lib/models/embedded-media";
import type { JobDTO } from "@/types/job";

function embeddedMediaDTO(m: EmbeddedMedia | null) {
  return m ? { id: m._id.toString(), key: m.key, url: mediaUrl(m.key) } : null;
}

export function toJobDTO(j: JobHydrated): JobDTO {
  return {
    id: j._id.toString(),
    title: j.title,
    description: j.description,
    categories: j.categories.map((c) => ({ id: c._id.toString(), name: c.name })),
    jobTypes: j.jobTypes.map((t) => ({ id: t._id.toString(), name: t.name })),
    coverImage: embeddedMediaDTO(j.coverImage),
    thumbnail: embeddedMediaDTO(j.thumbnail),
    seo: {
      metaTitle: j.seo.metaTitle,
      metaDescription: j.seo.metaDescription,
      metaKeywords: [...j.seo.metaKeywords],
      ogImage: j.seo.ogImage,
    },
    isActive: j.isActive,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  };
}

// Resolve category ids to embedded snapshots, rejecting unknown/deleted ones.
async function resolveCategories(ids: string[]): Promise<JobCategory[]> {
  const docs = await Category.find({
    _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
    isDeleted: false,
  }).select("name");
  if (docs.length !== ids.length) {
    throw new BadRequestError("One or more selected categories no longer exist");
  }
  return docs.map((d) => ({ _id: d._id, name: d.name }));
}

// Resolve job-type ids to embedded snapshots, rejecting unknown/deleted ones.
async function resolveJobTypes(ids: string[]): Promise<JobTypeSnapshot[]> {
  const docs = await JobType.find({
    _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
    isDeleted: false,
  }).select("name");
  if (docs.length !== ids.length) {
    throw new BadRequestError("One or more selected job types no longer exist");
  }
  return docs.map((d) => ({ _id: d._id, name: d.name }));
}

export async function getJobById(id: string): Promise<JobDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Job");
  const doc = await Job.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Job");
  return toJobDTO(doc);
}

export async function listJobs(query: ListJobsQuery): Promise<CursorPage<JobDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.categoryId) filter["categories._id"] = new Types.ObjectId(query.categoryId);
  if (query.jobTypeId) filter["jobTypes._id"] = new Types.ObjectId(query.jobTypeId);
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await Job.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toJobDTO), query.limit);
}

export async function createJob(body: CreateJobBody): Promise<JobDTO> {
  const doc = await Job.create({
    title: body.title,
    description: sanitizeHtml(body.description),
    categories: await resolveCategories(body.categoryIds),
    jobTypes: await resolveJobTypes(body.jobTypeIds),
    coverImage: body.coverImage,
    thumbnail: body.thumbnail,
    seo: body.seo,
  });
  return toJobDTO(doc);
}

export async function updateJob(id: string, patch: UpdateJobBody): Promise<JobDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Job");
  const doc = await Job.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Job");

  if (patch.title !== undefined) doc.title = patch.title;
  if (patch.description !== undefined) doc.description = sanitizeHtml(patch.description);
  if (patch.categoryIds !== undefined) doc.categories = await resolveCategories(patch.categoryIds);
  if (patch.jobTypeIds !== undefined) doc.jobTypes = await resolveJobTypes(patch.jobTypeIds);
  if (patch.coverImage !== undefined) doc.set("coverImage", patch.coverImage);
  if (patch.thumbnail !== undefined) doc.set("thumbnail", patch.thumbnail);
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;
  if (patch.seo !== undefined) doc.seo = patch.seo;

  await doc.save();
  return toJobDTO(doc);
}

export async function deleteJob(id: string): Promise<JobDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Job");
  const doc = await Job.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Job");

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();
  return toJobDTO(doc);
}
