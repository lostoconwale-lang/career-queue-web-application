export const HEADER_LINKS_MAX = 8;

export const HEADER_VISIBILITY = ["all", "guest", "auth"] as const;
export type HeaderVisibility = (typeof HEADER_VISIBILITY)[number];

export type HeaderLinkTarget =
  { type: "route"; path: string } | { type: "page"; pageId: string; slug: string; title: string };

export interface HeaderLinkDTO {
  id: string;
  label: string;
  target: HeaderLinkTarget;
  visibility: HeaderVisibility;
  isActive: boolean;
}

// GET/PUT /api/v1/header — admin editor for the site nav links.
export interface HeaderDTO {
  links: HeaderLinkDTO[];
  updatedAt: string;
}

// GET /api/v1/header/link-options — search results for the link destination picker.
export interface HeaderLinkOptionDTO {
  type: "route" | "page";
  // The route path, or the static page's id.
  value: string;
  label: string;
}
