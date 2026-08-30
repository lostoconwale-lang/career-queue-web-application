import "server-only";
import { Types } from "mongoose";

import { Category } from "@/lib/models/category.model";
import { Job } from "@/lib/models/job.model";
import { JobType } from "@/lib/models/job-type.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import { toJobDTO } from "@/lib/services/job.service";
import type { PublicJobsQuery } from "@/lib/validators/public-job.validator";
import type { JobFilterOptionsDTO, PublicJobListDTO } from "@/types/public-job";
import type { JobDTO } from "@/types/job";

// The one filter every public query starts from: visible, non-deleted jobs.
const ACTIVE_JOB_FILTER = { isActive: true, isDeleted: false };

// GET /api/v1/public/jobs — search + filter, page-based (the listing lets
// visitors jump to an arbitrary page, so cursor pagination doesn't fit here).
export async function listPublicJobs(query: PublicJobsQuery): Promise<PublicJobListDTO> {
  const filter: Record<string, unknown> = { ...ACTIVE_JOB_FILTER };

  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.categories?.length) {
    filter["categories._id"] = { $in: query.categories.map((id) => new Types.ObjectId(id)) };
  }
  if (query.types?.length) {
    filter["jobTypes._id"] = { $in: query.types.map((id) => new Types.ObjectId(id)) };
  }

  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Job.countDocuments(filter),
  ]);

  return {
    items: docs.map(toJobDTO),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

// GET /api/v1/public/job-filters — active categories/job types plus how many
// currently-active jobs carry each one, for the listing's filter panel.
export async function getJobFilterOptions(): Promise<JobFilterOptionsDTO> {
  const [categories, jobTypes, categoryCounts, jobTypeCounts] = await Promise.all([
    Category.find({ isActive: true, isDeleted: false }).select("name").sort({ name: 1 }),
    JobType.find({ isActive: true, isDeleted: false }).select("name").sort({ name: 1 }),
    Job.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: ACTIVE_JOB_FILTER },
      { $unwind: "$categories" },
      { $group: { _id: "$categories._id", count: { $sum: 1 } } },
    ]),
    Job.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: ACTIVE_JOB_FILTER },
      { $unwind: "$jobTypes" },
      { $group: { _id: "$jobTypes._id", count: { $sum: 1 } } },
    ]),
  ]);

  const categoryCountById = new Map(categoryCounts.map((c) => [c._id.toString(), c.count]));
  const jobTypeCountById = new Map(jobTypeCounts.map((t) => [t._id.toString(), t.count]));

  return {
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      count: categoryCountById.get(c._id.toString()) ?? 0,
    })),
    jobTypes: jobTypes.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      count: jobTypeCountById.get(t._id.toString()) ?? 0,
    })),
  };
}

// Used by the (server-rendered) job detail page — a direct model query, no
// HTTP round trip, since it's already running on the server.
export async function getPublicJobById(id: string): Promise<JobDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await Job.findOne({ _id: id, ...ACTIVE_JOB_FILTER });
  return doc ? toJobDTO(doc) : null;
}
