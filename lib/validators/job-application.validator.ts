import { z } from "zod";

import { listQuerySchema, objectIdSchema } from "@/lib/validators/common";
import { JOB_APPLICATION_STATUSES } from "@/types/job-application";

// POST /api/v1/applications — any logged-in user, applying as themselves.
export const createJobApplicationBodySchema = z.object({
  jobId: objectIdSchema,
});
export type CreateJobApplicationBody = z.infer<typeof createJobApplicationBodySchema>;

// PUT /api/v1/applications/:id — admin only. Move it through the review pipeline.
export const updateJobApplicationBodySchema = z
  .object({
    status: z.enum(JOB_APPLICATION_STATUSES),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateJobApplicationBody = z.infer<typeof updateJobApplicationBodySchema>;

// GET /api/v1/applications — admin only. Mirrors the admin job list's filters.
export const listJobApplicationsQuerySchema = listQuerySchema.extend({
  status: z.enum(JOB_APPLICATION_STATUSES).optional(),
  categoryId: objectIdSchema.optional(),
  jobTypeId: objectIdSchema.optional(),
  jobId: objectIdSchema.optional(),
});
export type ListJobApplicationsQuery = z.infer<typeof listJobApplicationsQuerySchema>;
