// A featured category as shown on the home page, with a live open-roles count.
export interface PublicPopularCategoryDTO {
  id: string;
  name: string;
  iconUrl: string | null;
  openRoles: number;
}

// The "Popular job categories" content shown to visitors on the home page.
export interface PublicPopularCategoriesDTO {
  headline: string;
  categories: PublicPopularCategoryDTO[];
}
