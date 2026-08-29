import { z } from "zod";

import { JOB_LIMITS } from "@/lib/job.constants";
import { htmlToText } from "@/lib/sanitize-html";
import { listQuerySchema, objectIdSchema } from "@/lib/validators/common";

const L = JOB_LIMITS;

const jobTitleSchema = z
  .string()
  .trim()
  .min(L.title.min, `Title must be at least ${L.title.min} characters`)
  .max(L.title.max, "Title is too long")
  .regex(/\p{L}/u, "Enter a valid job title");

const jobDescriptionSchema = z
  .string()
  .trim()
  .max(L.description.max, "Description is too long")
  .refine(
    (html) => htmlToText(html).length >= L.description.min,
    `Description must be at least ${L.description.min} characters`,
  );

const jobCategoryIdsSchema = z
  .array(objectIdSchema)
  .transform((ids) => [...new Set(ids)])
  .refine((ids) => ids.length >= L.categories.min, "Pick at least one category")
  .refine((ids) => ids.length <= L.categories.max, `Pick at most ${L.categories.max} categories`);

const jobTypeIdsSchema = z
  .array(objectIdSchema)
  .transform((ids) => [...new Set(ids)])
  .refine((ids) => ids.length >= L.jobTypes.min, "Pick at least one job type")
  .refine((ids) => ids.length <= L.jobTypes.max, `Pick at most ${L.jobTypes.max} job types`);

// An embedded image reference — just the storage key. Required for a job.
const imageRefSchema = z.object({ key: z.string().trim().min(1).max(300) });

// A job's SEO block — stricter than the shared one: every field is required.
const jobSeoSchema = z.object({
  metaTitle: z
    .string()
    .trim()
    .min(L.metaTitle.min, `Meta title must be at least ${L.metaTitle.min} characters`)
    .max(L.metaTitle.max, `Keep the meta title under ${L.metaTitle.max} characters`),
  metaDescription: z
    .string()
    .trim()
    .min(
      L.metaDescription.min,
      `Meta description must be at least ${L.metaDescription.min} characters`,
    )
    .max(
      L.metaDescription.max,
      `Keep the meta description under ${L.metaDescription.max} characters`,
    ),
  metaKeywords: z
    .array(z.string().trim().min(2).max(40))
    .min(L.metaKeywords.min, `Add at least ${L.metaKeywords.min} keywords`)
    .max(L.metaKeywords.max, `Use at most ${L.metaKeywords.max} keywords`),
  ogImage: z.string().trim().max(500).default(""),
});

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// POST /api/v1/jobs
export const createJobBodySchema = z.object({
  title: jobTitleSchema,
  description: jobDescriptionSchema,
  categoryIds: jobCategoryIdsSchema,
  jobTypeIds: jobTypeIdsSchema,
  coverImage: imageRefSchema,
  thumbnail: imageRefSchema,
  seo: jobSeoSchema,
});
export type CreateJobBody = z.infer<typeof createJobBodySchema>;

// PUT /api/v1/jobs/:id — any subset of the fields, plus the active toggle.
export const updateJobBodySchema = z
  .object({
    title: jobTitleSchema,
    description: jobDescriptionSchema,
    categoryIds: jobCategoryIdsSchema,
    jobTypeIds: jobTypeIdsSchema,
    coverImage: imageRefSchema,
    thumbnail: imageRefSchema,
    isActive: z.boolean(),
    seo: jobSeoSchema,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateJobBody = z.infer<typeof updateJobBodySchema>;

export const listJobsQuerySchema = listQuerySchema.extend({
  isActive: boolFlag.optional(),
  categoryId: objectIdSchema.optional(),
  jobTypeId: objectIdSchema.optional(),
});
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
