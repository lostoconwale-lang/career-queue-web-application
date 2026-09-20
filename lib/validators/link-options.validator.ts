import { z } from "zod";

// GET /api/v1/link-options
export const linkOptionsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
});
export type LinkOptionsQuery = z.infer<typeof linkOptionsQuerySchema>;
