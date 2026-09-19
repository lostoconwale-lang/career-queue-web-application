import type { SeoMeta } from "@/types/seo";

// A CMS-managed static page (privacy policy, terms, about, …) as shown to
// visitors at /page/<slug>.
export interface PublicPageDTO {
  title: string;
  content: string; // sanitized HTML from the rich-text editor
  seo: SeoMeta;
}
