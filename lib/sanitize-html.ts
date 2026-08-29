// Minimal HTML sanitiser for admin-authored rich text (job descriptions).
// Admins are trusted, but this strips the obvious script-injection vectors so
// the stored HTML is safe to render with `dangerouslySetInnerHTML`.
const BLOCK_TAG = /<\/?(script|style|iframe|object|embed|link|meta|base|form)\b[^>]*>/gi;
const EVENT_ATTR = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URI = /(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi;

export function sanitizeHtml(input: string): string {
  return input.replace(BLOCK_TAG, "").replace(EVENT_ATTR, "").replace(JS_URI, '$1="#"').trim();
}

// Plain-text version of HTML, for search indexing / previews.
export function htmlToText(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
