// Cache tags for Next's data cache (`unstable_cache` / `revalidateTag`).
// Kept in one place so a writer and the cached reader can't drift apart.
export const CACHE_TAGS = {
  // The active-city list behind the public search menus.
  publicCities: "public-cities",
} as const;
