import { z } from "zod";

import { emailSchema } from "@/lib/validators/common";
import { SOCIAL_PLATFORMS } from "@/types/settings";

// An embedded image reference — just the storage key, or null to clear it.
const imageRefSchema = z.object({ key: z.string().trim().min(1).max(300) }).nullable();

// Blank, or a valid email.
const optionalEmailSchema = z.union([z.literal(""), emailSchema]).default("");

const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.string().trim().url("Enter a valid URL").max(300),
});

// PUT /api/v1/settings — the whole record is replaced, so every field defaults
// and a submitted body is always complete.
export const updateSettingsBodySchema = z.object({
  siteName: z.string().trim().min(1, "Enter the website name").max(120),
  tagline: z.string().trim().max(200).default(""),
  contactEmail: optionalEmailSchema,
  contactPhone: z.string().trim().max(30).default(""),
  logoLight: imageRefSchema.default(null),
  logoDark: imageRefSchema.default(null),
  notificationEmails: z
    .array(emailSchema)
    .max(20, "At most 20 notification emails")
    .default([])
    .transform((list) => [...new Set(list)]),
  seo: z
    .object({
      metaTitle: z.string().trim().max(70, "Keep the meta title under 70 characters").default(""),
      metaDescription: z
        .string()
        .trim()
        .max(160, "Keep the meta description under 160 characters")
        .default(""),
      metaKeywords: z.array(z.string().trim().min(1)).max(30).default([]),
      ogImage: imageRefSchema.default(null),
    })
    .default({}),
  socialLinks: z
    .array(socialLinkSchema)
    .max(SOCIAL_PLATFORMS.length)
    .default([])
    .refine(
      (links) => new Set(links.map((l) => l.platform)).size === links.length,
      "Each social platform can only be added once",
    ),
});
export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;
