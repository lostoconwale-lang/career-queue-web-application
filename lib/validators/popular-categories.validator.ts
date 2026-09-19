import { z } from "zod";

import { objectIdSchema } from "@/lib/validators/common";
import { POPULAR_CATEGORIES_LIMIT } from "@/types/popular-categories";

// PUT /api/v1/popular-categories — the whole record is replaced, in the given order.
export const updatePopularCategoriesBodySchema = z.object({
  headline: z.string().trim().min(1, "Enter the headline").max(100),
  categoryIds: z
    .array(objectIdSchema)
    .max(POPULAR_CATEGORIES_LIMIT, `At most ${POPULAR_CATEGORIES_LIMIT} categories can be featured`)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Each category can only be featured once",
    ),
});
export type UpdatePopularCategoriesBody = z.infer<typeof updatePopularCategoriesBodySchema>;
