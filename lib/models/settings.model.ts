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

import { embeddedMediaSchema, type EmbeddedMedia } from "@/lib/models/embedded-media";
import { SOCIAL_PLATFORMS, type SocialLink } from "@/types/settings";

// The settings record is a singleton — exactly one document, found by `key`.
export const SETTINGS_KEY = "global";

interface SettingsSeo {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage: EmbeddedMedia | null;
}

export interface SettingsDoc {
  _id: Types.ObjectId;
  key: string;
  siteName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  logoLight: EmbeddedMedia | null;
  logoDark: EmbeddedMedia | null;
  notificationEmails: string[];
  seo: SettingsSeo;
  socialLinks: SocialLink[];
  createdAt: Date;
  updatedAt: Date;
}

export type SettingsHydrated = HydratedDocument<SettingsDoc>;
export type SettingsModel = Model<SettingsDoc>;

const settingsSeoSchema = new Schema<SettingsSeo>(
  {
    metaTitle: { type: String, trim: true, maxlength: 70, default: "" },
    metaDescription: { type: String, trim: true, maxlength: 160, default: "" },
    metaKeywords: { type: [String], default: [] },
    ogImage: { type: embeddedMediaSchema, default: null },
  },
  { _id: false },
);

const socialLinkSchema = new Schema<SocialLink>(
  {
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    url: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { _id: false },
);

const settingsSchema = new Schema<SettingsDoc, SettingsModel>(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    siteName: { type: String, trim: true, maxlength: 120, default: "" },
    tagline: { type: String, trim: true, maxlength: 200, default: "" },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
    contactPhone: { type: String, trim: true, maxlength: 30, default: "" },
    logoLight: { type: embeddedMediaSchema, default: null },
    logoDark: { type: embeddedMediaSchema, default: null },
    notificationEmails: { type: [String], default: [] },
    seo: { type: settingsSeoSchema, default: () => ({}) },
    socialLinks: { type: [socialLinkSchema], default: [] },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.Settings) deleteModel("Settings");

export const Settings: SettingsModel =
  (models.Settings as SettingsModel) ??
  model<SettingsDoc, SettingsModel>("Settings", settingsSchema);
