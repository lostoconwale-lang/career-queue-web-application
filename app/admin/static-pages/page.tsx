import { StaticPageList } from "./StaticPageList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/static-pages and /api/v1/static-pages/:id (admin-only).
export default function StaticPagesPage() {
  return <StaticPageList />;
}
