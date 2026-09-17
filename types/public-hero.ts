export interface PublicHeroJobCardDTO {
  companyName: string;
  logoUrl: string;
  jobTitle: string;
  tags: string[];
  salary: string;
  jobId: string | null;
}

// The hero content shown to visitors on the home page.
export interface PublicHeroDTO {
  badgeText: string;
  headlineLine1: string;
  headlineLine2: string;
  headlineLine3: string;
  headlineHighlight: string;
  subtext: string;
  trustText: string;
  quickFilters: string[];
  jobCards: PublicHeroJobCardDTO[];
}
