import type { EmbeddedMediaDTO } from "@/types/media";

// The headline chains each active step's word together (Search → Match →
// Apply), so the grid can't be empty and shouldn't run too long.
export const HOW_IT_WORKS_STEPS_MIN = 1;
export const HOW_IT_WORKS_STEPS_MAX = 6;

export interface HowItWorksStepDTO {
  word: string;
  image: EmbeddedMediaDTO | null;
  title: string;
  body: string;
  isActive: boolean;
}

// GET/PUT /api/v1/how-it-works — the "How it works" home page section.
export interface HowItWorksDTO {
  eyebrow: string;
  subtext: string;
  steps: HowItWorksStepDTO[];
  updatedAt: string;
}
