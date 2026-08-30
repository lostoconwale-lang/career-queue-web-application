import { ApplicationList } from "./ApplicationList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/applications and /api/v1/applications/:id (admin-only).
export default function ApplicationsPage() {
  return <ApplicationList />;
}
