import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { mediaUrl } from "@/lib/media";
import { Testimonial } from "@/lib/models/testimonial.model";
import {
  TestimonialsSection,
  TESTIMONIALS_SECTION_KEY,
} from "@/lib/models/testimonials-section.model";
import type { PublicTestimonialDTO, PublicTestimonialsDTO } from "@/types/public-testimonial";

const DEFAULT_HEADING = "Offers, not open tabs";

// The heading and testimonials an admin featured on the home page, in the
// order they picked. Rendered on every visit but only changes when an admin
// edits the selection, so the query is wrapped in Next's data cache and
// tagged — `revalidatePublicTestimonials()` clears it on any write.
async function queryPublicTestimonials(): Promise<PublicTestimonialsDTO> {
  await connectToDatabase();

  const section = await TestimonialsSection.findOne({ key: TESTIMONIALS_SECTION_KEY });
  const heading = section?.heading ?? DEFAULT_HEADING;
  const testimonialIds = section?.testimonialIds ?? [];
  if (testimonialIds.length === 0) return { heading, testimonials: [] };

  const docs = await Testimonial.find({
    _id: { $in: testimonialIds },
    isActive: true,
    isDeleted: false,
  }).select("authorName role quote image");
  const byId = new Map(docs.map((t) => [t._id.toString(), t]));

  // Preserve the admin's chosen order; skip any id that's since been
  // deactivated or deleted.
  const testimonials = testimonialIds
    .map((id) => {
      const t = byId.get(id.toString());
      if (!t) return null;
      return {
        id: id.toString(),
        authorName: t.authorName,
        role: t.role,
        quote: t.quote,
        imageUrl: mediaUrl(t.image.key),
      };
    })
    .filter((t): t is PublicTestimonialDTO => t !== null);

  return { heading, testimonials };
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
