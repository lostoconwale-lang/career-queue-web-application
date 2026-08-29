import type { SeoMeta } from "@/types/seo";

export interface CityDTO {
  id: string;
  name: string;
  seo: SeoMeta;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
