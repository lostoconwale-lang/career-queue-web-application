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
import { embeddedMediaSchema, type EmbeddedMedia } from "@/lib/models/embedded-media";
import { seoSchema } from "@/lib/models/seo";
import { htmlToText } from "@/lib/sanitize-html";
import type { SeoMeta } from "@/types/seo";

// A category snapshot embedded on the job. `_id` is the Category's own id.
export interface JobCategory {
  _id: Types.ObjectId;
  name: string;
}

// A job-type snapshot embedded on the job. `_id` is the JobType's own id.
export interface JobTypeSnapshot {
  _id: Types.ObjectId;
  name: string;
}

// A company snapshot embedded on the job. `_id` is the Company's own id.
export interface JobCompany {
  _id: Types.ObjectId;
  name: string;
  logo: EmbeddedMedia | null;
}

export interface JobDoc {
  _id: Types.ObjectId;
  title: string;
  description: string;
  categories: JobCategory[];
  jobTypes: JobTypeSnapshot[];
  company: JobCompany | null;
  coverImage: EmbeddedMedia | null;
  thumbnail: EmbeddedMedia | null;
  seo: SeoMeta;
  searchKeyword: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type JobHydrated = HydratedDocument<JobDoc>;
export type JobModel = Model<JobDoc>;

// `_id` is the referenced Category's own id (we set it explicitly).
const jobCategorySchema = new Schema<JobCategory>({
  _id: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
});

// `_id` is the referenced JobType's own id.
const jobTypeSnapshotSchema = new Schema<JobTypeSnapshot>({
  _id: { type: Schema.Types.ObjectId, ref: "JobType", required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
});

// `_id` is the referenced Company's own id.
const jobCompanySchema = new Schema<JobCompany>({
  _id: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  logo: { type: embeddedMediaSchema, default: null },
});

const jobSchema = new Schema<JobDoc, JobModel>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 20000 },
    categories: { type: [jobCategorySchema], default: [] },
    jobTypes: { type: [jobTypeSnapshotSchema], default: [] },
    company: { type: jobCompanySchema, default: null },
    coverImage: { type: embeddedMediaSchema, default: null },
    thumbnail: { type: embeddedMediaSchema, default: null },
    seo: { type: seoSchema, default: () => ({}) },
    searchKeyword: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

jobSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([
    this.title,
    this.categories.map((c) => c.name).join(" "),
    this.jobTypes.map((t) => t.name).join(" "),
    this.company?.name,
    htmlToText(this.description),
  ]);
});

jobSchema.index({ searchKeyword: 1 });
jobSchema.index({ isActive: 1, isDeleted: 1 });
jobSchema.index({ "categories._id": 1, isDeleted: 1 });
jobSchema.index({ "jobTypes._id": 1, isDeleted: 1 });
jobSchema.index({ "company._id": 1, isDeleted: 1 });

if (process.env.NODE_ENV !== "production" && models.Job) deleteModel("Job");

export const Job: JobModel = (models.Job as JobModel) ?? model<JobDoc, JobModel>("Job", jobSchema);
