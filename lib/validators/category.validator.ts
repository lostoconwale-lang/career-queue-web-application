import { z } from "zod";

import { listQuerySchema } from "@/lib/validators/common";
import { seoInputSchema } from "@/lib/validators/seo.validator";

const categoryNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the category name")
  .max(120, "Name is too long")
  .regex(/\p{L}/u, "Enter a valid category name");

const categoryDescriptionSchema = z.string().trim().max(500, "Description is too long");

// An embedded icon reference — just the storage key, or null to clear it.
const iconSchema = z.object({ key: z.string().trim().min(1).max(300) }).nullable();

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// POST /api/v1/categories
export const createCategoryBodySchema = z.object({
  name: categoryNameSchema,
  description: categoryDescriptionSchema.default(""),
  icon: iconSchema.optional(),
  seo: seoInputSchema.optional(),
});
export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;

// PUT /api/v1/categories/:id — edit name, description, icon, active state and/or SEO.
export const updateCategoryBodySchema = z
  .object({
    name: categoryNameSchema,
    description: categoryDescriptionSchema,
    icon: iconSchema,
    isActive: z.boolean(),
    seo: seoInputSchema,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>;

export const listCategoriesQuerySchema = listQuerySchema.extend({
  isActive: boolFlag.optional(),
});
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
