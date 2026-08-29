import { JobForm } from "../../JobForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Loads via GET /api/v1/jobs/:id,
// submits PUT to the same.
export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobForm jobId={id} />;
}
