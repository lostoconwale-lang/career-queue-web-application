import type { JobDTO } from "@/types/job";

// A category or job type as shown in the listing's filter panel — a name to
// display plus how many currently-active jobs carry it.
export interface JobFilterOption {
  id: string;
  name: string;
  count: number;
}

export interface JobFilterOptionsDTO {
  categories: JobFilterOption[];
  jobTypes: JobFilterOption[];
}

// Page-based (not cursor-based) since the public listing needs to jump to an
// arbitrary page number, not just page forward/back.
export interface PublicJobListDTO {
  items: JobDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
