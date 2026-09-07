import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { mediaUrl } from "@/lib/media";
import { Testimonial } from "@/lib/models/testimonial.model";
import type { PublicTestimonialDTO } from "@/types/public-testimonial";

// The active testimonials shown on the home page, newest first. Rendered on
// every landing-page visit but only changes when an admin edits the list, so
// the query is wrapped in Next's data cache and tagged —
// `revalidatePublicTestimonials()` clears it on any testimonial write.
async function queryPublicTestimonials(): Promise<PublicTestimonialDTO[]> {
  await connectToDatabase();
  const docs = await Testimonial.find({ isActive: true, isDeleted: false })
    .select("authorName role quote image")
    .sort({ _id: -1 });
  return docs.map((t) => ({
    id: t._id.toString(),
    authorName: t.authorName,
    role: t.role,
    quote: t.quote,
    imageUrl: mediaUrl(t.image.key),
  }));
}

export const listPublicTestimonials = unstable_cache(
  queryPublicTestimonials,
  ["public-testimonials"],
  {
    tags: [CACHE_TAGS.publicTestimonials],
    // Fallback for out-of-band changes (seed scripts, direct DB edits) that
    // never call revalidatePublicTestimonials().
    revalidate: 3600,
  },
);

export function revalidatePublicTestimonials(): void {
  revalidateTag(CACHE_TAGS.publicTestimonials, "max");
}
