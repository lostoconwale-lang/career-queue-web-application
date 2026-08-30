import "server-only";
import { Types } from "mongoose";

import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { Job } from "@/lib/models/job.model";
import {
  JobApplication,
  type ApplicantSnapshot,
  type ApplicationJobSnapshot,
  type JobApplicationHydrated,
} from "@/lib/models/job-application.model";
import { User } from "@/lib/models/user.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import type {
  CreateJobApplicationBody,
  ListJobApplicationsQuery,
  UpdateJobApplicationBody,
} from "@/lib/validators/job-application.validator";
import type { CursorPage } from "@/types/api";
import type { JobApplicationDTO } from "@/types/job-application";

export function toJobApplicationDTO(a: JobApplicationHydrated): JobApplicationDTO {
  return {
    id: a._id.toString(),
    job: {
      id: a.job._id.toString(),
      title: a.job.title,
      company: a.job.company
        ? { id: a.job.company._id.toString(), name: a.job.company.name }
        : null,
      categories: a.job.categories.map((c) => ({ id: c._id.toString(), name: c.name })),
      jobTypes: a.job.jobTypes.map((t) => ({ id: t._id.toString(), name: t.name })),
    },
    applicant: {
      id: a.applicant._id.toString(),
      name: a.applicant.name,
      email: a.applicant.email,
      phone: a.applicant.phone ?? null,
    },
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// Snapshot the job's filterable fields at the moment of applying — an edit to
// the job later (e.g. renaming a category) won't retroactively change what
// this application shows or how it's filtered.
async function resolveJobSnapshot(jobId: string): Promise<ApplicationJobSnapshot> {
  const job = await Job.findOne({ _id: jobId, isActive: true, isDeleted: false });
  if (!job) throw new NotFoundError("Job");
  return {
    _id: job._id,
    title: job.title,
    company: job.company ? { _id: job.company._id, name: job.company.name } : null,
    categories: job.categories.map((c) => ({ _id: c._id, name: c.name })),
    jobTypes: job.jobTypes.map((t) => ({ _id: t._id, name: t.name })),
  };
}

async function resolveApplicant(userId: string): Promise<ApplicantSnapshot> {
  const user = await User.findById(userId).select("name email phone");
  if (!user) throw new NotFoundError("User");
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
  };
}

export async function createJobApplication(
  userId: string,
  body: CreateJobApplicationBody,
): Promise<JobApplicationDTO> {
  const [job, applicant] = await Promise.all([
    resolveJobSnapshot(body.jobId),
    resolveApplicant(userId),
  ]);

  if (
    await JobApplication.exists({
      "applicant._id": applicant._id,
      "job._id": job._id,
      isDeleted: false,
    })
  ) {
    throw new ConflictError("You've already applied to this job");
  }

  const doc = await JobApplication.create({ job, applicant });
  return toJobApplicationDTO(doc);
}

export async function getJobApplicationById(id: string): Promise<JobApplicationDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Application");
  const doc = await JobApplication.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Application");
  return toJobApplicationDTO(doc);
}

export async function listJobApplications(
  query: ListJobApplicationsQuery,
): Promise<CursorPage<JobApplicationDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.jobId) filter["job._id"] = new Types.ObjectId(query.jobId);
  if (query.categoryId) filter["job.categories._id"] = new Types.ObjectId(query.categoryId);
  if (query.jobTypeId) filter["job.jobTypes._id"] = new Types.ObjectId(query.jobTypeId);
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await JobApplication.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toJobApplicationDTO), query.limit);
}

export async function updateJobApplication(
  id: string,
  patch: UpdateJobApplicationBody,
): Promise<JobApplicationDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Application");
  const doc = await JobApplication.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Application");

  if (patch.status !== undefined) doc.status = patch.status;

  await doc.save();
  return toJobApplicationDTO(doc);
}

export async function deleteJobApplication(id: string): Promise<JobApplicationDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Application");
  const doc = await JobApplication.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Application");

  doc.isDeleted = true;
  await doc.save();
  return toJobApplicationDTO(doc);
}
