import "server-only";

/**
 * Normalises text to the exact shape stored in `searchKeyword`: lowercase, only
 * `a-z 0-9` and single spaces. List queries run the SAME normaliser on the
 * search term, so the lookup is a plain case-sensitive `$regex` (no `i` flag,
 * no metacharacters to escape) against a clean, index-friendly value.
 */
export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** `searchKeyword` value for a document — its searchable fields, normalised. */
export function buildSearchKeyword(parts: Array<string | undefined | null>): string {
  return normalizeSearchText(parts.filter((part): part is string => Boolean(part)).join(" "));
}
