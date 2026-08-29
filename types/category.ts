import type { EmbeddedMediaDTO } from "@/types/media";
import type { SeoMeta } from "@/types/seo";

export interface CategoryDTO {
  id: string;
  name: string;
  description: string;
  icon: EmbeddedMediaDTO | null;
  seo: SeoMeta;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
