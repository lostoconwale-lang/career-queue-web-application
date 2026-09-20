// The active footer link columns, resolved to a real href.
export interface PublicFooterLinkDTO {
  label: string;
  href: string;
}

export interface PublicFooterSectionDTO {
  heading: string;
  links: PublicFooterLinkDTO[];
}
