import { z } from "zod";

// PUT /api/v1/hero — the whole record is replaced, so every field defaults
// and a submitted body is always complete.
export const updateHeroBodySchema = z.object({
  badgeText: z.string().trim().min(1, "Enter the badge text").max(60),
  headlineLine1: z.string().trim().min(1, "Enter the first headline line").max(40),
  headlineLine2: z.string().trim().min(1, "Enter the second headline line").max(40),
  headlineLine3: z.string().trim().min(1, "Enter the third headline line").max(40),
  headlineHighlight: z.string().trim().min(1, "Enter the highlighted word").max(20),
  subtext: z.string().trim().min(1, "Enter the supporting text").max(220),
  trustText: z.string().trim().min(1, "Enter the trust line").max(80),
});
export type UpdateHeroBody = z.infer<typeof updateHeroBodySchema>;
