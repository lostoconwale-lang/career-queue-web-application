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

export interface FaqDoc {
  _id: Types.ObjectId;
  question: string;
  answer: string;
  sortOrder: number;
  searchKeyword: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FaqHydrated = HydratedDocument<FaqDoc>;
export type FaqModel = Model<FaqDoc>;

const faqSchema = new Schema<FaqDoc, FaqModel>(
  {
    question: { type: String, required: true, trim: true, maxlength: 250 },
    answer: { type: String, required: true, trim: true, maxlength: 4000 },
    sortOrder: { type: Number, required: true, default: 0 },
    searchKeyword: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

faqSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.question, this.answer]);
});
faqSchema.index({ searchKeyword: 1 });
// Public + admin listing order.
faqSchema.index({ isActive: 1, isDeleted: 1, sortOrder: 1 });

if (process.env.NODE_ENV !== "production" && models.Faq) deleteModel("Faq");

export const Faq: FaqModel = (models.Faq as FaqModel) ?? model<FaqDoc, FaqModel>("Faq", faqSchema);
