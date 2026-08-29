import "server-only";
import { Schema } from "mongoose";

import type { SeoMeta } from "@/types/seo";

// Embeddable SEO block for any website-facing model. It's a value object, so no
// own `_id`. Attach with: `seo: { type: seoSchema, default: () => ({}) }`.
export const seoSchema = new Schema<SeoMeta>(
  {
    metaTitle: { type: String, trim: true, maxlength: 70, default: "" },
    metaDescription: { type: String, trim: true, maxlength: 160, default: "" },
    metaKeywords: { type: [String], default: [] },
    ogImage: { type: String, trim: true, maxlength: 500, default: "" },
  },
  {  timestamps: true },
);
