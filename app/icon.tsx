import { CACHE_TAGS } from "@/lib/cache/tags";
import { listPublicSettings } from "@/lib/services/public-settings.service";

// The original static mark, kept as the fallback until an admin uploads a favicon.
const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <rect width="40" height="40" rx="12" fill="#6C4DFF"/>
  <rect x="9" y="8.5" width="22" height="7" rx="3.5" fill="#FFFFFF" opacity="0.42"/>
  <rect x="9" y="17" width="22" height="7" rx="3.5" fill="#FFFFFF" opacity="0.7"/>
  <rect x="9" y="25.5" width="22" height="7" rx="3.5" fill="#FFFFFF"/>
  <circle cx="13.4" cy="29" r="2" fill="#FF6B4A"/>
</svg>`;

const CONTENT_TYPES: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export default async function Icon() {
  const { faviconUrl } = await listPublicSettings();

  if (!faviconUrl) {
    return new Response(DEFAULT_ICON, { headers: { "Content-Type": "image/svg+xml" } });
  }

  const ext = faviconUrl.split(".").pop()?.toLowerCase() ?? "";
  const res = await fetch(faviconUrl, {
    next: { revalidate: 3600, tags: [CACHE_TAGS.publicSettings] },
  });
  const bytes = await res.arrayBuffer();
  return new Response(bytes, {
    headers: { "Content-Type": CONTENT_TYPES[ext] ?? "image/png" },
  });
}
