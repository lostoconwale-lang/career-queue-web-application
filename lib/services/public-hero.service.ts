import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { Hero, HERO_KEY } from "@/lib/models/hero.model";
import type { PublicHeroDTO } from "@/types/public-hero";

// The hero content shown on the home page. Rendered on every visit but only
// changes when an admin edits it, so the query is wrapped in Next's data
// cache — `revalidatePublicHero()` clears it on any hero write.
async function queryPublicHero(): Promise<PublicHeroDTO> {
  await connectToDatabase();
  const doc = await Hero.findOne({ key: HERO_KEY });
  return {
    badgeText: doc?.badgeText ?? "Now matching 12,400 open roles",
    headlineLine1: doc?.headlineLine1 ?? "Great careers",
    headlineLine2: doc?.headlineLine2 ?? "& great teams",
    headlineLine3: doc?.headlineLine3 ?? "don't happen by",
    headlineHighlight: doc?.headlineHighlight ?? "accident",
    subtext:
      doc?.subtext ??
      "We match people to jobs that actually fit — the team, the pay, the pace — instead of whatever got posted most recently.",
    trustText: doc?.trustText ?? "Trusted by job seekers at 500+ companies",
  };
}

export const listPublicHero = unstable_cache(queryPublicHero, ["public-hero"], {
  tags: [CACHE_TAGS.publicHero],
  // Fallback for out-of-band changes (seed scripts, direct DB edits) that don't
  // go through the API and so never call revalidatePublicHero().
  revalidate: 3600,
});

export function revalidatePublicHero(): void {
  revalidateTag(CACHE_TAGS.publicHero, "max");
}
