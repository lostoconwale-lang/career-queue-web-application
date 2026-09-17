import "server-only";
import { Schema, deleteModel, model, models, type HydratedDocument, type Model, type Types } from "mongoose";

import { embeddedMediaSchema, type EmbeddedMedia } from "@/lib/models/embedded-media";

// The hero record is a singleton — exactly one document, found by `key`.
export const HERO_KEY = "global";

export interface HeroJobCard {
  _id: Types.ObjectId;
  companyName: string;
  logo: EmbeddedMedia;
  jobTitle: string;
  tags: string[];
  salary: string;
  isActive: boolean;
  jobId: Types.ObjectId | null;
}

export interface HeroDoc {
  _id: Types.ObjectId;
  key: string;
  badgeText: string;
  headlineLine1: string;
  headlineLine2: string;
  headlineLine3: string;
  headlineHighlight: string;
  subtext: string;
  trustText: string;
  quickFilters: string[];
  jobCards: HeroJobCard[];
  avatars: EmbeddedMedia[];
  createdAt: Date;
  updatedAt: Date;
}

export type HeroHydrated = HydratedDocument<HeroDoc>;
export type HeroModel = Model<HeroDoc>;

const heroJobCardSchema = new Schema<HeroJobCard>({
  companyName: { type: String, required: true, trim: true, maxlength: 60 },
  logo: { type: embeddedMediaSchema, required: true },
  jobTitle: { type: String, required: true, trim: true, maxlength: 80 },
  tags: { type: [String], default: [] },
  salary: { type: String, trim: true, maxlength: 40, default: "" },
  isActive: { type: Boolean, required: true, default: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null },
});

const heroSchema = new Schema<HeroDoc, HeroModel>(
  {
    key: { type: String, required: true, unique: true, default: HERO_KEY },
    badgeText: { type: String, trim: true, maxlength: 60, default: "Now matching 12,400 open roles" },
    headlineLine1: { type: String, trim: true, maxlength: 40, default: "Great careers" },
    headlineLine2: { type: String, trim: true, maxlength: 40, default: "& great teams" },
    headlineLine3: { type: String, trim: true, maxlength: 40, default: "don't happen by" },
    headlineHighlight: { type: String, trim: true, maxlength: 20, default: "accident" },
    subtext: {
      type: String,
      trim: true,
      maxlength: 220,
      default:
        "We match people to jobs that actually fit — the team, the pay, the pace — instead of whatever got posted most recently.",
    },
    trustText: { type: String, trim: true, maxlength: 80, default: "Trusted by job seekers at 500+ companies" },
    quickFilters: {
      type: [String],
      default: ["Remote", "Design", "Engineering", "Marketing", "Product", "Data"],
    },
    jobCards: { type: [heroJobCardSchema], default: [] },
    avatars: { type: [embeddedMediaSchema], default: [] },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.Hero) deleteModel("Hero");

export const Hero: HeroModel =
  (models.Hero as HeroModel) ?? model<HeroDoc, HeroModel>("Hero", heroSchema);
