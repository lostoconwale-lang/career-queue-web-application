// Shared field limits for jobs — imported by both the Zod validators (server)
// and the admin form (client) so the two never drift.
export const JOB_LIMITS = {
  title: { min: 3, max: 160 },
  // Measured on the plain text of the description HTML.
  description: { min: 50, max: 20000 },
  categories: { min: 1, max: 5 },
  jobTypes: { min: 1, max: 4 },
  metaTitle: { min: 15, max: 70 },
  metaDescription: { min: 50, max: 160 },
  // Count of keywords, not characters.
  metaKeywords: { min: 3, max: 30 },
} as const;

/** Split the comma-separated keyword input into a clean list. */
export function parseKeywords(input: string): string[] {
  return input
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}
