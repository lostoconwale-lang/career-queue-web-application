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
import type { SeoMeta } from "@/types/seo";

export interface CityDoc {
  _id: Types.ObjectId;
  name: string;
  seo: SeoMeta;
  searchKeyword: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CityHydrated = HydratedDocument<CityDoc>;
export type CityModel = Model<CityDoc>;

const citySchema = new Schema<CityDoc, CityModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    seo: { type: seoSchema, default: () => ({}) },
    searchKeyword: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

citySchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.name]);
});
// Unique city name, but only among the ones that aren't soft-deleted.
citySchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
citySchema.index({ searchKeyword: 1 });
citySchema.index({ isActive: 1, isDeleted: 1 });

if (process.env.NODE_ENV !== "production" && models.City) deleteModel("City");

export const City: CityModel =
  (models.City as CityModel) ?? model<CityDoc, CityModel>("City", citySchema);
