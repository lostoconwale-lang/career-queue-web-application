import { z } from "zod";

import { HOW_IT_WORKS_STEPS_MAX, HOW_IT_WORKS_STEPS_MIN } from "@/types/how-it-works";

const imageRefSchema = z.object({ key: z.string().trim().min(1).max(300) });

const howItWorksStepBodySchema = z.object({
  word: z.string().trim().min(1, "Enter the step word").max(20),
  image: imageRefSchema,
  title: z.string().trim().min(1, "Enter the step title").max(100),
  body: z.string().trim().min(1, "Enter the step description").max(300),
  isActive: z.boolean().default(true),
});

// PUT /api/v1/how-it-works — the whole record is replaced, so every field
// defaults and a submitted body is always complete.
export const updateHowItWorksBodySchema = z.object({
  eyebrow: z.string().trim().min(1, "Enter the eyebrow text").max(60),
  subtext: z.string().trim().min(1, "Enter the supporting text").max(200),
  steps: z
    .array(howItWorksStepBodySchema)
    .min(HOW_IT_WORKS_STEPS_MIN, "Add at least one step")
    .max(HOW_IT_WORKS_STEPS_MAX, `At most ${HOW_IT_WORKS_STEPS_MAX} steps`),
});
export type UpdateHowItWorksBody = z.infer<typeof updateHowItWorksBodySchema>;
