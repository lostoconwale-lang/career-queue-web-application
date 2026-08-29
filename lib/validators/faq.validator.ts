import { z } from "zod";

import { listQuerySchema } from "@/lib/validators/common";

const questionSchema = z
  .string()
  .trim()
  .min(5, "Enter the question")
  .max(250, "Question is too long");

const answerSchema = z.string().trim().min(5, "Enter the answer").max(4000, "Answer is too long");

const sortOrderSchema = z.number().int().min(0).max(9999);

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// POST /api/v1/faqs
export const createFaqBodySchema = z.object({
  question: questionSchema,
  answer: answerSchema,
  sortOrder: sortOrderSchema.default(0),
});
export type CreateFaqBody = z.infer<typeof createFaqBodySchema>;

// PUT /api/v1/faqs/:id
export const updateFaqBodySchema = z
  .object({
    question: questionSchema,
    answer: answerSchema,
    sortOrder: sortOrderSchema,
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateFaqBody = z.infer<typeof updateFaqBodySchema>;

export const listFaqsQuerySchema = listQuerySchema.extend({
  isActive: boolFlag.optional(),
});
export type ListFaqsQuery = z.infer<typeof listFaqsQuerySchema>;
