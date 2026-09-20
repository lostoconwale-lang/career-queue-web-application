import "server-only";

import { normalizeSearchText } from "@/lib/models/searchable";
import { SITE_ROUTES } from "@/lib/site-routes";
import { StaticPage } from "@/lib/models/static-pages.model";
import type { LinkOptionDTO } from "@/types/link-options";

const LINK_OPTIONS_LIMIT = 20;

// Search across the known routes and static pages, for the header/footer link editors.
export async function listLinkOptions(q?: string): Promise<LinkOptionDTO[]> {
  const term = q?.trim().toLowerCase() ?? "";

  const routes: LinkOptionDTO[] = SITE_ROUTES.filter(
    (r) => !term || r.label.toLowerCase().includes(term) || r.path.toLowerCase().includes(term),
  ).map((r) => ({ type: "route", value: r.path, label: r.label }));

  const filter: Record<string, unknown> = { isDeleted: false, isActive: true };
  if (term) filter.searchKeyword = { $regex: normalizeSearchText(term) };

  const pages = await StaticPage.find(filter)
    .sort({ title: 1 })
    .limit(LINK_OPTIONS_LIMIT)
    .select("title");

  const pageOptions: LinkOptionDTO[] = pages.map((p) => ({
    type: "page",
    value: p._id.toString(),
    label: p.title,
  }));

  return [...routes, ...pageOptions];
}
