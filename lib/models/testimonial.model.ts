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

export interface TestimonialDoc {
  _id: Types.ObjectId;
  authorName: string;
  role: string;
  quote: string;
  rating: number;
  image: EmbeddedMedia;
  searchKeyword: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TestimonialHydrated = HydratedDocument<TestimonialDoc>;
export type TestimonialModel = Model<TestimonialDoc>;

const testimonialSchema = new Schema<TestimonialDoc, TestimonialModel>(
  {
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 150 },
    quote: { type: String, required: true, trim: true, maxlength: 600 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    image: { type: embeddedMediaSchema, required: true },
    searchKeyword: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

testimonialSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.authorName, this.role, this.quote]);
});
testimonialSchema.index({ searchKeyword: 1 });
testimonialSchema.index({ isActive: 1, isDeleted: 1 });

if (process.env.NODE_ENV !== "production" && models.Testimonial) deleteModel("Testimonial");

export const Testimonial: TestimonialModel =
  (models.Testimonial as TestimonialModel) ??
  model<TestimonialDoc, TestimonialModel>("Testimonial", testimonialSchema);
