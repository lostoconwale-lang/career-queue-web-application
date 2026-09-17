import { z } from "zod";

import { objectIdSchema } from "@/lib/validators/common";
import { HERO_AVATARS_LIMIT, HERO_JOB_CARDS_LIMIT, HERO_QUICK_FILTERS_LIMIT } from "@/types/hero";

const imageRefSchema = z.object({ key: z.string().trim().min(1).max(300) });

const heroJobCardBodySchema = z.object({
  companyName: z.string().trim().min(1, "Enter the company name").max(60),
  logo: imageRefSchema,
  jobTitle: z.string().trim().min(1, "Enter the job title").max(80),
  tags: z.array(z.string().trim().min(1).max(24)).max(3, "At most 3 tags"),
  salary: z.string().trim().max(40).default(""),
  isActive: z.boolean().default(true),
  jobId: objectIdSchema.nullable().default(null),
});

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
  quickFilters: z
    .array(z.string().trim().min(1).max(24))
    .min(1, "Add at least one quick filter")
    .max(HERO_QUICK_FILTERS_LIMIT, `At most ${HERO_QUICK_FILTERS_LIMIT} quick filters`),
  jobCards: z
    .array(heroJobCardBodySchema)
    .max(HERO_JOB_CARDS_LIMIT, `Only ${HERO_JOB_CARDS_LIMIT} job cards are shown on the home page`),
  avatars: z.array(imageRefSchema).max(HERO_AVATARS_LIMIT, `At most ${HERO_AVATARS_LIMIT} avatars`),
});
export type UpdateHeroBody = z.infer<typeof updateHeroBodySchema>;
