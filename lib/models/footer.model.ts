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

// The record is a singleton — exactly one document, found by `key`.
export const FOOTER_KEY = "global";

export interface FooterLink {
  _id: Types.ObjectId;
  label: string;
  targetType: "route" | "page";
  routePath: string | null;
  pageId: Types.ObjectId | null;
  isActive: boolean;
}

export interface FooterSection {
  _id: Types.ObjectId;
  heading: string;
  links: FooterLink[];
}

export interface FooterDoc {
  _id: Types.ObjectId;
  key: string;
  sections: FooterSection[];
  createdAt: Date;
  updatedAt: Date;
}

export type FooterHydrated = HydratedDocument<FooterDoc>;
export type FooterModel = Model<FooterDoc>;

const footerLinkSchema = new Schema<FooterLink>(
  {
    label: { type: String, required: true, trim: true, maxlength: 40 },
    targetType: { type: String, enum: ["route", "page"], required: true },
    routePath: { type: String, trim: true, default: null },
    pageId: { type: Schema.Types.ObjectId, ref: "StaticPage", default: null },
    isActive: { type: Boolean, required: true, default: true },
  },
  { _id: true },
);

const footerSectionSchema = new Schema<FooterSection>(
  {
    heading: { type: String, required: true, trim: true, maxlength: 40 },
    links: { type: [footerLinkSchema], default: [] },
  },
  { _id: true },
);

const footerSchema = new Schema<FooterDoc, FooterModel>(
  {
    key: { type: String, required: true, unique: true, default: FOOTER_KEY },
    sections: { type: [footerSectionSchema], default: [] },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.Footer) {
  deleteModel("Footer");
}

export const Footer: FooterModel =
  (models.Footer as FooterModel) ?? model<FooterDoc, FooterModel>("Footer", footerSchema);
