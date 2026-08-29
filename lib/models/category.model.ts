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
import type { SeoMeta } from "@/types/seo";

export interface CategoryDoc {
  _id: Types.ObjectId;
  name: string;
  description: string;
  icon: EmbeddedMedia | null;
  seo: SeoMeta;
  searchKeyword: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryHydrated = HydratedDocument<CategoryDoc>;
export type CategoryModel = Model<CategoryDoc>;

const categorySchema = new Schema<CategoryDoc, CategoryModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    icon: { type: embeddedMediaSchema, default: null },
    seo: { type: seoSchema, default: () => ({}) },
    searchKeyword: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

categorySchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.name, this.description]);
});
// Unique category name, but only among the ones that aren't soft-deleted.
categorySchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
categorySchema.index({ searchKeyword: 1 });
categorySchema.index({ isActive: 1, isDeleted: 1 });

if (process.env.NODE_ENV !== "production" && models.Category) deleteModel("Category");

export const Category: CategoryModel =
  (models.Category as CategoryModel) ??
  model<CategoryDoc, CategoryModel>("Category", categorySchema);
