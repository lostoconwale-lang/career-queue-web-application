import type { HeaderVisibility } from "@/types/header";

// The active header links, resolved to a real href. Cached and shared across
// visitors — `visibility` lets the viewer filter it for their own auth state.
export interface PublicHeaderLinkDTO {
  label: string;
  href: string;
  visibility: HeaderVisibility;
}
