// SEO metadata embedded in every website-facing model (city, and later jobs,
// companies, categories, …).
export interface SeoMeta {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage: string;
}

export const EMPTY_SEO: SeoMeta = {
  metaTitle: "",
  metaDescription: "",
  metaKeywords: [],
  ogImage: "",
};
