import { MediaLibrary } from "./MediaLibrary";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/media and /api/v1/media/:id (admin-only).
export default function MediaPage() {
  return <MediaLibrary />;
}
