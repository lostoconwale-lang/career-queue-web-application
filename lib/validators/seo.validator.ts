import { z } from "zod";

// A full SEO block. Every field defaults, so a provided `seo` is always
// complete — services replace the stored block rather than merging.
export const seoInputSchema = z.object({
  metaTitle: z.string().trim().max(70, "Keep the meta title under 70 characters").default(""),
  metaDescription: z
    .string()
    .trim()
    .max(160, "Keep the meta description under 160 characters")
    .default(""),
  metaKeywords: z.array(z.string().trim().min(1)).max(30).default([]),
  ogImage: z.string().trim().max(500).default(""),
});
export type SeoInput = z.infer<typeof seoInputSchema>;
