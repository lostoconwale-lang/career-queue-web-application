import { JobTypeForm } from "../../JobTypeForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Loads via GET /api/v1/job-types/:id,
// submits PUT to the same.
export default async function EditJobTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobTypeForm jobTypeId={id} />;
}
