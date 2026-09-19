import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { StaticPage } from "@/lib/models/static-pages.model";
import type { PublicPageDTO } from "@/types/public-page";

// Used by the (server-rendered) /page/[slug] route — a direct model query, no
// HTTP round trip, since it's already running on the server.
export async function getPublicPageBySlug(slug: string): Promise<PublicPageDTO | null> {
  await connectToDatabase();
  const doc = await StaticPage.findOne({ slug, isActive: true, isDeleted: false });
  if (!doc) return null;
  return {
    title: doc.title,
    content: doc.content,
    seo: {
      metaTitle: doc.seo.metaTitle,
      metaDescription: doc.seo.metaDescription,
      metaKeywords: [...doc.seo.metaKeywords],
      ogImage: doc.seo.ogImage,
    },
  };
}
