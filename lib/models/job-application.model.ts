import "server-only";
import {
  Schema,
  deleteModel,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

import { buildSearchKeyword } from "@/lib/models/searchable";
import { PHONE_COUNTRY_CODES, type Phone } from "@/types/auth";
import { JOB_APPLICATION_STATUSES, type JobApplicationStatus } from "@/types/job-application";

// -- Embedded snapshots — the whole point of this schema. An admin browsing
// applications needs the job's filterable fields (category/type/company) and
// the applicant's contact details on every row; embedding both here means the
// list, search and filter queries never join against Job or User. --

export interface ApplicationCategoryRef {
  _id: Types.ObjectId;
  name: string;
}

export interface ApplicationJobTypeRef {
  _id: Types.ObjectId;
  name: string;
}

export interface ApplicationCompanyRef {
  _id: Types.ObjectId;
  name: string;
}

export interface ApplicationJobSnapshot {
  _id: Types.ObjectId;
  title: string;
  company: ApplicationCompanyRef | null;
  categories: ApplicationCategoryRef[];
  jobTypes: ApplicationJobTypeRef[];
}

export interface ApplicantSnapshot {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: Phone | null;
}

export interface JobApplicationDoc {
  _id: Types.ObjectId;
  job: ApplicationJobSnapshot;
  applicant: ApplicantSnapshot;
  status: JobApplicationStatus;
  searchKeyword: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type JobApplicationHydrated = HydratedDocument<JobApplicationDoc>;
export type JobApplicationModel = Model<JobApplicationDoc>;

const categoryRefSchema = new Schema<ApplicationCategoryRef>({
  _id: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
});

const jobTypeRefSchema = new Schema<ApplicationJobTypeRef>({
  _id: { type: Schema.Types.ObjectId, ref: "JobType", required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
});

const companyRefSchema = new Schema<ApplicationCompanyRef>({
  _id: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
});

const jobSnapshotSchema = new Schema<ApplicationJobSnapshot>({
  _id: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  company: { type: companyRefSchema, default: null },
  categories: { type: [categoryRefSchema], default: [] },
  jobTypes: { type: [jobTypeRefSchema], default: [] },
});

const applicantSchema = new Schema<ApplicantSnapshot>({
  _id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: {
    countryCode: { type: String, enum: PHONE_COUNTRY_CODES },
    number: { type: String },
  },
});

const jobApplicationSchema = new Schema<JobApplicationDoc, JobApplicationModel>(
  {
    job: { type: jobSnapshotSchema, required: true },
    applicant: { type: applicantSchema, required: true },
    status: {
      type: String,
      enum: JOB_APPLICATION_STATUSES,
      required: true,
      default: "pending",
    },
    searchKeyword: { type: String, required: true, select: false },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

jobApplicationSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([
    this.applicant.name,
    this.applicant.email,
    this.applicant.phone?.number,
    this.job.title,
    this.job.company?.name,
    this.job.categories.map((c) => c.name).join(" "),
    this.job.jobTypes.map((t) => t.name).join(" "),
  ]);
});

// One (non-deleted) application per user per job.
jobApplicationSchema.index(
  { "applicant._id": 1, "job._id": 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
jobApplicationSchema.index({ searchKeyword: 1 });
jobApplicationSchema.index({ status: 1, isDeleted: 1 });
jobApplicationSchema.index({ "job._id": 1, isDeleted: 1 });
jobApplicationSchema.index({ "job.categories._id": 1, isDeleted: 1 });
jobApplicationSchema.index({ "job.jobTypes._id": 1, isDeleted: 1 });
jobApplicationSchema.index({ "applicant._id": 1, isDeleted: 1 });
// Admin list's default view: newest first, not deleted.
jobApplicationSchema.index({ isDeleted: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production" && models.JobApplication) {
  deleteModel("JobApplication");
}

export const JobApplication: JobApplicationModel =
  (models.JobApplication as JobApplicationModel) ??
  model<JobApplicationDoc, JobApplicationModel>("JobApplication", jobApplicationSchema);
