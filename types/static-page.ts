import type { SeoMeta } from "@/types/seo";

// A CMS-style static page (privacy policy, terms, about, …), rendered on the
// public site at /<slug>.
export interface StaticPageDTO {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML from the rich-text editor
  seo: SeoMeta;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
