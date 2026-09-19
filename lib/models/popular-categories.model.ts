import "server-only";
import { Schema, deleteModel, model, models, type HydratedDocument, type Model, type Types } from "mongoose";

// The record is a singleton — exactly one document, found by `key`.
export const POPULAR_CATEGORIES_KEY = "global";

export interface PopularCategoriesDoc {
  _id: Types.ObjectId;
  key: string;
  categoryIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type PopularCategoriesHydrated = HydratedDocument<PopularCategoriesDoc>;
export type PopularCategoriesModel = Model<PopularCategoriesDoc>;

const popularCategoriesSchema = new Schema<PopularCategoriesDoc, PopularCategoriesModel>(
  {
    key: { type: String, required: true, unique: true, default: POPULAR_CATEGORIES_KEY },
    categoryIds: { type: [{ type: Schema.Types.ObjectId, ref: "Category" }], default: [] },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.PopularCategories) {
  deleteModel("PopularCategories");
}

export const PopularCategories: PopularCategoriesModel =
  (models.PopularCategories as PopularCategoriesModel) ??
  model<PopularCategoriesDoc, PopularCategoriesModel>(
    "PopularCategories",
    popularCategoriesSchema,
  );
