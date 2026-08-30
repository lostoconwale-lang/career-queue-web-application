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

export interface CompanyDoc {
  _id: Types.ObjectId;
  name: string;
  description: string;
  website: string;
  logo: EmbeddedMedia | null;
  searchKeyword: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CompanyHydrated = HydratedDocument<CompanyDoc>;
export type CompanyModel = Model<CompanyDoc>;

const companySchema = new Schema<CompanyDoc, CompanyModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    website: { type: String, trim: true, maxlength: 300, default: "" },
    logo: { type: embeddedMediaSchema, default: null },
    searchKeyword: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

companySchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.name, this.description]);
});
// Unique company name, but only among the ones that aren't soft-deleted.
companySchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
companySchema.index({ searchKeyword: 1 });
companySchema.index({ isActive: 1, isDeleted: 1 });

if (process.env.NODE_ENV !== "production" && models.Company) deleteModel("Company");

export const Company: CompanyModel =
  (models.Company as CompanyModel) ?? model<CompanyDoc, CompanyModel>("Company", companySchema);
