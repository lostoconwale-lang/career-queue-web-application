import { z } from "zod";

import { listQuerySchema } from "@/lib/validators/common";
import { seoInputSchema } from "@/lib/validators/seo.validator";

const cityNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the city name")
  .max(120, "Name is too long")
  .regex(/\p{L}/u, "Enter a valid city name");

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// POST /api/v1/cities
export const createCityBodySchema = z.object({
  name: cityNameSchema,
  seo: seoInputSchema.optional(),
});
export type CreateCityBody = z.infer<typeof createCityBodySchema>;

// PUT /api/v1/cities/:id — rename, toggle active, and/or replace the SEO block.
export const updateCityBodySchema = z
  .object({ name: cityNameSchema, isActive: z.boolean(), seo: seoInputSchema })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateCityBody = z.infer<typeof updateCityBodySchema>;

export const listCitiesQuerySchema = listQuerySchema.extend({
  isActive: boolFlag.optional(),
});
export type ListCitiesQuery = z.infer<typeof listCitiesQuerySchema>;
