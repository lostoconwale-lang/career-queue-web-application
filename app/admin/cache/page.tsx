import { CachePanel } from "./CachePanel";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Clears via /api/v1/cache/clear.
export default function CachePage() {
  return <CachePanel />;
}
