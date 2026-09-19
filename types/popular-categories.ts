import type { EmbeddedMediaDTO } from "@/types/media";

// The home page grid has room for a handful of featured categories.
export const POPULAR_CATEGORIES_LIMIT = 8;

export interface PopularCategoryRef {
  id: string;
  name: string;
  icon: EmbeddedMediaDTO | null;
}

// GET/PUT /api/v1/popular-categories — the categories admins picked to
// feature on the home page, in the order they'll appear.
export interface PopularCategoriesDTO {
  categories: PopularCategoryRef[];
  updatedAt: string;
}
