import { JobTypeForm } from "../JobTypeForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Submits POST /api/v1/job-types.
export default function NewJobTypePage() {
  return <JobTypeForm />;
}
