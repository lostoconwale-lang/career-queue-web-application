import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { Faq } from "@/lib/models/faq.model";
import type { PublicFaqDTO } from "@/types/public-faq";

// The active FAQ entries shown on the home page, in display order. Rendered on
// every landing-page visit but only changes when an admin edits the FAQ list,
// so the query is wrapped in Next's data cache and tagged — `revalidatePublicFaqs()`
// clears it on any FAQ write.
async function queryPublicFaqs(): Promise<PublicFaqDTO[]> {
  await connectToDatabase();
  const docs = await Faq.find({ isActive: true, isDeleted: false })
    .select("question answer")
    .sort({ sortOrder: 1, _id: -1 });
  return docs.map((f) => ({ id: f._id.toString(), question: f.question, answer: f.answer }));
}

export const listPublicFaqs = unstable_cache(queryPublicFaqs, ["public-faqs"], {
  tags: [CACHE_TAGS.publicFaqs],
  // Fallback for out-of-band changes (seed scripts, direct DB edits) that don't
  // go through the API and so never call revalidatePublicFaqs().
  revalidate: 3600,
});

export function revalidatePublicFaqs(): void {
  revalidateTag(CACHE_TAGS.publicFaqs, "max");
}
