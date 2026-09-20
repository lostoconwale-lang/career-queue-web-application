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

import { HEADER_VISIBILITY, type HeaderVisibility } from "@/types/header";

// The record is a singleton — exactly one document, found by `key`.
export const HEADER_KEY = "global";

export interface HeaderLink {
  _id: Types.ObjectId;
  label: string;
  targetType: "route" | "page";
  routePath: string | null;
  pageId: Types.ObjectId | null;
  visibility: HeaderVisibility;
  isActive: boolean;
}

export interface HeaderDoc {
  _id: Types.ObjectId;
  key: string;
  links: HeaderLink[];
  createdAt: Date;
  updatedAt: Date;
}

export type HeaderHydrated = HydratedDocument<HeaderDoc>;
export type HeaderModel = Model<HeaderDoc>;

const headerLinkSchema = new Schema<HeaderLink>(
  {
    label: { type: String, required: true, trim: true, maxlength: 40 },
    targetType: { type: String, enum: ["route", "page"], required: true },
    routePath: { type: String, trim: true, default: null },
    pageId: { type: Schema.Types.ObjectId, ref: "StaticPage", default: null },
    visibility: { type: String, enum: HEADER_VISIBILITY, required: true, default: "all" },
    isActive: { type: Boolean, required: true, default: true },
  },
  { _id: true },
);

const headerSchema = new Schema<HeaderDoc, HeaderModel>(
  {
    key: { type: String, required: true, unique: true, default: HEADER_KEY },
    links: { type: [headerLinkSchema], default: [] },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.Header) {
  deleteModel("Header");
}

export const Header: HeaderModel =
  (models.Header as HeaderModel) ?? model<HeaderDoc, HeaderModel>("Header", headerSchema);
