// GET /api/v1/link-options — search results for an admin link-destination
// picker (shared by the header and footer link editors).
export interface LinkOptionDTO {
  type: "route" | "page";
  // The route path, or the static page's id.
  value: string;
  label: string;
}
