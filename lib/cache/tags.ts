// Cache tags for Next's data cache (`unstable_cache` / `revalidateTag`).
// Kept in one place so a writer and the cached reader can't drift apart.
export const CACHE_TAGS = {
  // The active-city list behind the public search menus.
  publicCities: "public-cities",
  // The active FAQ entries shown on the home page.
  publicFaqs: "public-faqs",
  // The active testimonials shown on the home page.
  publicTestimonials: "public-testimonials",
} as const;
