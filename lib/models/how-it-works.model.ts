import "server-only";
import { Schema, deleteModel, model, models, type HydratedDocument, type Model, type Types } from "mongoose";

import { embeddedMediaSchema, type EmbeddedMedia } from "@/lib/models/embedded-media";

// The record is a singleton — exactly one document, found by `key`.
export const HOW_IT_WORKS_KEY = "global";

export interface HowItWorksStep {
  _id: Types.ObjectId;
  word: string;
  image: EmbeddedMedia;
  title: string;
  body: string;
  isActive: boolean;
}

export interface HowItWorksDoc {
  _id: Types.ObjectId;
  key: string;
  eyebrow: string;
  subtext: string;
  steps: HowItWorksStep[];
  createdAt: Date;
  updatedAt: Date;
}

export type HowItWorksHydrated = HydratedDocument<HowItWorksDoc>;
export type HowItWorksModel = Model<HowItWorksDoc>;

const howItWorksStepSchema = new Schema<HowItWorksStep>({
  word: { type: String, required: true, trim: true, maxlength: 20 },
  image: { type: embeddedMediaSchema, required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  body: { type: String, required: true, trim: true, maxlength: 300 },
  isActive: { type: Boolean, required: true, default: true },
});

const howItWorksSchema = new Schema<HowItWorksDoc, HowItWorksModel>(
  {
    key: { type: String, required: true, unique: true, default: HOW_IT_WORKS_KEY },
    eyebrow: { type: String, trim: true, maxlength: 60, default: "How it works" },
    subtext: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "Three steps, about ten minutes, and no cover letter until you actually want the job.",
    },
    steps: { type: [howItWorksStepSchema], default: [] },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.HowItWorks) deleteModel("HowItWorks");

export const HowItWorks: HowItWorksModel =
  (models.HowItWorks as HowItWorksModel) ??
  model<HowItWorksDoc, HowItWorksModel>("HowItWorks", howItWorksSchema);
