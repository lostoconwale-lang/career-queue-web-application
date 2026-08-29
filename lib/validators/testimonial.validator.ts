import { z } from "zod";

import { listQuerySchema } from "@/lib/validators/common";

const authorNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the person's name")
  .max(120, "Name is too long")
  .regex(/\p{L}/u, "Enter a valid name");

const roleSchema = z
  .string()
  .trim()
  .min(2, "Enter their role or company")
  .max(150, "Role is too long");

const quoteSchema = z
  .string()
  .trim()
  .min(10, "The testimonial is too short")
  .max(600, "The testimonial is too long");

const ratingSchema = z
  .number({ invalid_type_error: "Pick a rating" })
  .int()
  .min(1, "Pick a rating")
  .max(5, "Rating is 1–5");

// The person's photo — required. Just the storage key.
const imageSchema = z.object({ key: z.string().trim().min(1).max(300) });

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// POST /api/v1/testimonials
export const createTestimonialBodySchema = z.object({
  authorName: authorNameSchema,
  role: roleSchema,
  quote: quoteSchema,
  rating: ratingSchema,
  image: imageSchema,
});
export type CreateTestimonialBody = z.infer<typeof createTestimonialBodySchema>;

// PUT /api/v1/testimonials/:id
export const updateTestimonialBodySchema = z
  .object({
    authorName: authorNameSchema,
    role: roleSchema,
    quote: quoteSchema,
    rating: ratingSchema,
    image: imageSchema,
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateTestimonialBody = z.infer<typeof updateTestimonialBodySchema>;

export const listTestimonialsQuerySchema = listQuerySchema.extend({
  isActive: boolFlag.optional(),
});
export type ListTestimonialsQuery = z.infer<typeof listTestimonialsQuerySchema>;
