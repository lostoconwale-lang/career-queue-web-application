import { z } from "zod";

import { htmlToText } from "@/lib/sanitize-html";
import { listQuerySchema } from "@/lib/validators/common";
import { seoInputSchema } from "@/lib/validators/seo.validator";

// Slugs that would clash with real routes.
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "register",
  "onboarding",
  "pending",
  "no-access",
]);

const titleSchema = z.string().trim().min(3, "Enter the page title").max(200, "Title is too long");

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a URL slug")
  .max(200, "Slug is too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only")
  .refine((s) => !RESERVED_SLUGS.has(s), "That slug is reserved");

const contentSchema = z
  .string()
  .trim()
  .max(50000, "Content is too long")
  .refine((html) => htmlToText(html).length >= 20, "Add some page content");

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// POST /api/v1/static-pages
export const createStaticPageBodySchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  content: contentSchema,
  seo: seoInputSchema.optional(),
});
export type CreateStaticPageBody = z.infer<typeof createStaticPageBodySchema>;

// PUT /api/v1/static-pages/:id
export const updateStaticPageBodySchema = z
  .object({
    title: titleSchema,
    slug: slugSchema,
    content: contentSchema,
    isActive: z.boolean(),
    seo: seoInputSchema,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateStaticPageBody = z.infer<typeof updateStaticPageBodySchema>;

export const listStaticPagesQuerySchema = listQuerySchema.extend({
  isActive: boolFlag.optional(),
});
export type ListStaticPagesQuery = z.infer<typeof listStaticPagesQuerySchema>;
