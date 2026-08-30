import { z } from "zod";

import { objectIdSchema } from "@/lib/validators/common";

// Comma-separated ids from a query param, e.g. `?categories=<id>,<id>`.
const idListSchema = z
  .string()
  .trim()
  .transform((value) => [...new Set(value.split(",").map((id) => id.trim()).filter(Boolean))])
  .pipe(z.array(objectIdSchema))
  .optional();

// GET /api/v1/public/jobs — public, no auth. Active jobs only.
export const publicJobsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categories: idListSchema,
  types: idListSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(6),
});
export type PublicJobsQuery = z.infer<typeof publicJobsQuerySchema>;
