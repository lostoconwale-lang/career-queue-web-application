import { z } from "zod";

import { listQuerySchema } from "@/lib/validators/common";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter the job type name")
  .max(80, "Name is too long")
  .regex(/\p{L}/u, "Enter a valid name");

const descriptionSchema = z.string().trim().max(200, "Description is too long");

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// POST /api/v1/job-types
export const createJobTypeBodySchema = z.object({
  name: nameSchema,
  description: descriptionSchema.default(""),
});
export type CreateJobTypeBody = z.infer<typeof createJobTypeBodySchema>;

// PUT /api/v1/job-types/:id
export const updateJobTypeBodySchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateJobTypeBody = z.infer<typeof updateJobTypeBodySchema>;

export const listJobTypesQuerySchema = listQuerySchema.extend({
  isActive: boolFlag.optional(),
});
export type ListJobTypesQuery = z.infer<typeof listJobTypesQuerySchema>;
