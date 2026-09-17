import "server-only";

import { Hero, HERO_KEY, type HeroHydrated } from "@/lib/models/hero.model";
import type { UpdateHeroBody } from "@/lib/validators/hero.validator";
import type { HeroDTO } from "@/types/hero";

function toHeroDTO(h: HeroHydrated): HeroDTO {
  return {
    badgeText: h.badgeText,
    headlineLine1: h.headlineLine1,
    headlineLine2: h.headlineLine2,
    headlineLine3: h.headlineLine3,
    headlineHighlight: h.headlineHighlight,
    subtext: h.subtext,
    trustText: h.trustText,
    updatedAt: h.updatedAt.toISOString(),
  };
}

// Load the singleton, creating it (with its default copy) on first access.
async function loadOrCreate(): Promise<HeroHydrated> {
  // Atomic upsert so concurrent first-time reads can't race to create two rows.
  const doc = await Hero.findOneAndUpdate(
    { key: HERO_KEY },
    { $setOnInsert: { key: HERO_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!doc) throw new Error("Failed to load hero content");
  return doc;
}

export async function getHero(): Promise<HeroDTO> {
  return toHeroDTO(await loadOrCreate());
}

export async function updateHero(body: UpdateHeroBody): Promise<HeroDTO> {
  const doc = await loadOrCreate();

  doc.badgeText = body.badgeText;
  doc.headlineLine1 = body.headlineLine1;
  doc.headlineLine2 = body.headlineLine2;
  doc.headlineLine3 = body.headlineLine3;
  doc.headlineHighlight = body.headlineHighlight;
  doc.subtext = body.subtext;
  doc.trustText = body.trustText;

  await doc.save();
  return toHeroDTO(doc);
}
