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
import { seoSchema } from "@/lib/models/seo";
import { htmlToText } from "@/lib/sanitize-html";
import type { SeoMeta } from "@/types/seo";

export interface StaticPageDoc {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  seo: SeoMeta;
  searchKeyword: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StaticPageHydrated = HydratedDocument<StaticPageDoc>;
export type StaticPageModel = Model<StaticPageDoc>;

const staticPageSchema = new Schema<StaticPageDoc, StaticPageModel>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 50000 },
    seo: { type: seoSchema, default: () => ({}) },
    searchKeyword: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

staticPageSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.title, this.slug, htmlToText(this.content)]);
});
// Unique slug, but only among the ones that aren't soft-deleted.
staticPageSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
staticPageSchema.index({ searchKeyword: 1 });
staticPageSchema.index({ isActive: 1, isDeleted: 1 });

if (process.env.NODE_ENV !== "production" && models.StaticPage) deleteModel("StaticPage");

export const StaticPage: StaticPageModel =
  (models.StaticPage as StaticPageModel) ??
  model<StaticPageDoc, StaticPageModel>("StaticPage", staticPageSchema);
