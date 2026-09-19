import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { mediaUrl } from "@/lib/media";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { HowItWorks, HOW_IT_WORKS_KEY } from "@/lib/models/how-it-works.model";
import type { PublicHowItWorksDTO } from "@/types/public-how-it-works";

// The "How it works" content shown on the home page. Rendered on every visit
// but only changes when an admin edits it, so the query is wrapped in Next's
// data cache — `revalidatePublicHowItWorks()` clears it on any write.
async function queryPublicHowItWorks(): Promise<PublicHowItWorksDTO> {
  await connectToDatabase();
  const doc = await HowItWorks.findOne({ key: HOW_IT_WORKS_KEY });
  return {
    eyebrow: doc?.eyebrow ?? "How it works",
    subtext:
      doc?.subtext ??
      "Three steps, about ten minutes, and no cover letter until you actually want the job.",
    steps: (doc?.steps ?? [])
      .filter((s) => s.isActive)
      .map((s) => ({
        word: s.word,
        imageUrl: mediaUrl(s.image.key),
        title: s.title,
        body: s.body,
      })),
  };
}

export const listPublicHowItWorks = unstable_cache(
  queryPublicHowItWorks,
  ["public-how-it-works"],
  {
    tags: [CACHE_TAGS.publicHowItWorks],
    // Fallback for out-of-band changes (seed scripts, direct DB edits) that
    // don't go through the API and so never call revalidatePublicHowItWorks().
    revalidate: 3600,
  },
);

export function revalidatePublicHowItWorks(): void {
  revalidateTag(CACHE_TAGS.publicHowItWorks, "max");
}
