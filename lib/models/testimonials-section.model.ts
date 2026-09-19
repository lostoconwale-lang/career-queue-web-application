import "server-only";
import { Schema, deleteModel, model, models, type HydratedDocument, type Model, type Types } from "mongoose";

// The record is a singleton — exactly one document, found by `key`.
export const TESTIMONIALS_SECTION_KEY = "global";

export interface TestimonialsSectionDoc {
  _id: Types.ObjectId;
  key: string;
  heading: string;
  testimonialIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type TestimonialsSectionHydrated = HydratedDocument<TestimonialsSectionDoc>;
export type TestimonialsSectionModel = Model<TestimonialsSectionDoc>;

const testimonialsSectionSchema = new Schema<TestimonialsSectionDoc, TestimonialsSectionModel>(
  {
    key: { type: String, required: true, unique: true, default: TESTIMONIALS_SECTION_KEY },
    heading: { type: String, trim: true, maxlength: 100, default: "Offers, not open tabs" },
    testimonialIds: { type: [{ type: Schema.Types.ObjectId, ref: "Testimonial" }], default: [] },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.TestimonialsSection) {
  deleteModel("TestimonialsSection");
}

export const TestimonialsSection: TestimonialsSectionModel =
  (models.TestimonialsSection as TestimonialsSectionModel) ??
  model<TestimonialsSectionDoc, TestimonialsSectionModel>(
    "TestimonialsSection",
    testimonialsSectionSchema,
  );
