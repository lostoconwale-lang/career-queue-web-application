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

export interface JobTypeDoc {
  _id: Types.ObjectId;
  name: string;
  description: string;
  searchKeyword: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type JobTypeHydrated = HydratedDocument<JobTypeDoc>;
export type JobTypeModel = Model<JobTypeDoc>;

const jobTypeSchema = new Schema<JobTypeDoc, JobTypeModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    searchKeyword: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

jobTypeSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.name, this.description]);
});
// Unique name, but only among the ones that aren't soft-deleted.
jobTypeSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
jobTypeSchema.index({ searchKeyword: 1 });
jobTypeSchema.index({ isActive: 1, isDeleted: 1 });

if (process.env.NODE_ENV !== "production" && models.JobType) deleteModel("JobType");

export const JobType: JobTypeModel =
  (models.JobType as JobTypeModel) ?? model<JobTypeDoc, JobTypeModel>("JobType", jobTypeSchema);
