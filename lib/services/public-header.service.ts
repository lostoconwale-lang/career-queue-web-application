import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import type { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { Header, HEADER_KEY } from "@/lib/models/header.model";
import { StaticPage } from "@/lib/models/static-pages.model";
import type { PublicHeaderLinkDTO } from "@/types/public-header";

// The site header's nav links. Rendered on every page but only changes when an
// admin edits it, so the query is wrapped in Next's data cache —
// `revalidatePublicHeader()` clears it on any write.
async function queryPublicHeader(): Promise<PublicHeaderLinkDTO[]> {
  await connectToDatabase();
  const doc = await Header.findOne({ key: HEADER_KEY });
  const links = (doc?.links ?? []).filter((l) => l.isActive);

  const pageIds = links
    .filter((l) => l.targetType === "page" && l.pageId)
    .map((l) => l.pageId as Types.ObjectId);
  const pages = pageIds.length
    ? await StaticPage.find({ _id: { $in: pageIds }, isDeleted: false, isActive: true }).select(
        "slug",
      )
    : [];
  const slugById = new Map(pages.map((p) => [p._id.toString(), p.slug]));

  return links
    .map((l): PublicHeaderLinkDTO | null => {
      if (l.targetType === "route") {
        if (!l.routePath) return null;
        return { label: l.label, href: l.routePath, visibility: l.visibility };
      }
      const slug = l.pageId ? slugById.get(l.pageId.toString()) : undefined;
      if (!slug) return null;
      return { label: l.label, href: `/page/${slug}`, visibility: l.visibility };
    })
    .filter((l): l is PublicHeaderLinkDTO => l !== null);
}

export const listPublicHeader = unstable_cache(queryPublicHeader, ["public-header"], {
  tags: [CACHE_TAGS.publicHeader],
  // Fallback for out-of-band changes (seed scripts, direct DB edits) that
  // don't go through the API and so never call revalidatePublicHeader().
  revalidate: 3600,
});

export function revalidatePublicHeader(): void {
  revalidateTag(CACHE_TAGS.publicHeader, "max");
}
