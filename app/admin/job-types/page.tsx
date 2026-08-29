import { JobTypeList } from "./JobTypeList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/job-types and /api/v1/job-types/:id (admin-only).
export default function JobTypesPage() {
  return <JobTypeList />;
}
