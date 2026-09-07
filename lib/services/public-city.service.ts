import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { City } from "@/lib/models/city.model";
import type { PublicCityDTO } from "@/types/public-city";

// The active cities shown in the public search menus. This runs on nearly every
// landing-page visit but only changes when an admin edits the city list, so the
// query is wrapped in Next's data cache and tagged — `revalidatePublicCities()`
// clears it on any city write.
async function queryPublicCities(): Promise<PublicCityDTO[]> {
  await connectToDatabase();
  const docs = await City.find({ isActive: true, isDeleted: false })
    .select("name")
    .sort({ name: 1 });
  return docs.map((c) => ({ id: c._id.toString(), name: c.name }));
}

export const listPublicCities = unstable_cache(queryPublicCities, ["public-cities"], {
  tags: [CACHE_TAGS.publicCities],
  // Fallback for out-of-band changes (seed scripts, direct DB edits) that don't
  // go through the API and so never call revalidatePublicCities().
  revalidate: 3600,
});

export function revalidatePublicCities(): void {
  revalidateTag(CACHE_TAGS.publicCities, "max");
}
