import type { EmbeddedMediaDTO } from "@/types/media";

export interface CompanyDTO {
  id: string;
  name: string;
  description: string;
  website: string;
  logo: EmbeddedMediaDTO | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
