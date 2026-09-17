import type { EmbeddedMediaDTO } from "@/types/media";

// The home page only has 3 floating positions laid out for the mockup cards
// (see `floatPositions` in Hero.tsx) — more than that has nowhere to go.
export const HERO_JOB_CARDS_LIMIT = 3;
export const HERO_QUICK_FILTERS_LIMIT = 8;
export const HERO_AVATARS_LIMIT = 6;

// A snapshot of the job a card links to — just enough to show what's picked.
export interface HeroJobCardLinkedJob {
  id: string;
  title: string;
}

export interface HeroJobCardDTO {
  companyName: string;
  logo: EmbeddedMediaDTO | null;
  jobTitle: string;
  tags: string[];
  salary: string;
  isActive: boolean;
  linkedJob: HeroJobCardLinkedJob | null;
}

// GET/PUT /api/v1/hero — the home page hero content, editable by admins.
export interface HeroDTO {
  badgeText: string;
  headlineLine1: string;
  headlineLine2: string;
  headlineLine3: string;
  headlineHighlight: string;
  subtext: string;
  trustText: string;
  quickFilters: string[];
  jobCards: HeroJobCardDTO[];
  avatars: EmbeddedMediaDTO[];
  updatedAt: string;
}
