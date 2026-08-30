import type { EmbeddedMediaDTO } from "@/types/media";
import type { SeoMeta } from "@/types/seo";

// A category as it appears on a job — a snapshot of id + name.
export interface JobCategoryRef {
  id: string;
  name: string;
}

// A job type as it appears on a job — a snapshot of id + name.
export interface JobTypeRef {
  id: string;
  name: string;
}

// A company as it appears on a job — a snapshot of id, name and logo.
export interface JobCompanyRef {
  id: string;
  name: string;
  logo: EmbeddedMediaDTO | null;
}

export interface JobDTO {
  id: string;
  title: string;
  description: string; // HTML from the rich-text editor
  categories: JobCategoryRef[];
  jobTypes: JobTypeRef[];
  company: JobCompanyRef | null;
  coverImage: EmbeddedMediaDTO | null;
  thumbnail: EmbeddedMediaDTO | null;
  seo: SeoMeta;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
