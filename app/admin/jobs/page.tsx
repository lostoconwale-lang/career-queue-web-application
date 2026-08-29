import { JobList } from "./JobList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/jobs and /api/v1/jobs/:id (admin-only).
export default function JobsPage() {
  return <JobList />;
}
