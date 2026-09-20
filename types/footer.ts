// The footer has exactly two admin-managed link columns, next to the brand
// column (logo, description, socials) which is sourced from site settings.
export const FOOTER_SECTIONS_COUNT = 2;
export const FOOTER_LINKS_PER_SECTION_MAX = 6;

export type FooterLinkTarget =
  { type: "route"; path: string } | { type: "page"; pageId: string; slug: string; title: string };

export interface FooterLinkDTO {
  id: string;
  label: string;
  target: FooterLinkTarget;
  isActive: boolean;
}

export interface FooterSectionDTO {
  id: string;
  heading: string;
  links: FooterLinkDTO[];
}

// GET/PUT /api/v1/footer — admin editor for the two footer link columns.
export interface FooterDTO {
  sections: FooterSectionDTO[];
  updatedAt: string;
}
