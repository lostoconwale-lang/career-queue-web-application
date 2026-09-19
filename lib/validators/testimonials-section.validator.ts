import { z } from "zod";

import { objectIdSchema } from "@/lib/validators/common";
import { TESTIMONIALS_SECTION_LIMIT } from "@/types/testimonials-section";

// PUT /api/v1/testimonials-section — the whole record is replaced, in the given order.
export const updateTestimonialsSectionBodySchema = z.object({
  heading: z.string().trim().min(1, "Enter the heading").max(100),
  testimonialIds: z
    .array(objectIdSchema)
    .max(TESTIMONIALS_SECTION_LIMIT, `At most ${TESTIMONIALS_SECTION_LIMIT} testimonials can be featured`)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Each testimonial can only be featured once",
    ),
});
export type UpdateTestimonialsSectionBody = z.infer<typeof updateTestimonialsSectionBodySchema>;
