import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import type { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { Footer, FOOTER_KEY } from "@/lib/models/footer.model";
import { StaticPage } from "@/lib/models/static-pages.model";
import type { PublicFooterLinkDTO, PublicFooterSectionDTO } from "@/types/public-footer";

// The footer's link columns. Rendered on every page but only changes when an
// admin edits it, so the query is wrapped in Next's data cache —
// `revalidatePublicFooter()` clears it on any write.
async function queryPublicFooter(): Promise<PublicFooterSectionDTO[]> {
  await connectToDatabase();
  const doc = await Footer.findOne({ key: FOOTER_KEY });
  const sections = doc?.sections ?? [];

  const pageIds = sections
    .flatMap((s) => s.links)
    .filter((l) => l.isActive && l.targetType === "page" && l.pageId)
    .map((l) => l.pageId as Types.ObjectId);
  const pages = pageIds.length
    ? await StaticPage.find({ _id: { $in: pageIds }, isDeleted: false, isActive: true }).select(
        "slug",
      )
    : [];
  const slugById = new Map(pages.map((p) => [p._id.toString(), p.slug]));

  return sections.map((section) => ({
    heading: section.heading,
    links: section.links
      .filter((l) => l.isActive)
      .map((l): PublicFooterLinkDTO | null => {
        if (l.targetType === "route") {
          return l.routePath ? { label: l.label, href: l.routePath } : null;
        }
        const slug = l.pageId ? slugById.get(l.pageId.toString()) : undefined;
        return slug ? { label: l.label, href: `/page/${slug}` } : null;
      })
      .filter((l): l is PublicFooterLinkDTO => l !== null),
  }));
}

export const listPublicFooter = unstable_cache(queryPublicFooter, ["public-footer"], {
  tags: [CACHE_TAGS.publicFooter],
  // Fallback for out-of-band changes (seed scripts, direct DB edits) that
  // don't go through the API and so never call revalidatePublicFooter().
  revalidate: 3600,
});

export function revalidatePublicFooter(): void {
  revalidateTag(CACHE_TAGS.publicFooter, "max");
}
