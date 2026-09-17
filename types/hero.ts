// GET/PUT /api/v1/hero — the home page hero content, editable by admins.
export interface HeroDTO {
  badgeText: string;
  headlineLine1: string;
  headlineLine2: string;
  headlineLine3: string;
  headlineHighlight: string;
  subtext: string;
  trustText: string;
  updatedAt: string;
}
