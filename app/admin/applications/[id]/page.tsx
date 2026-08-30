import { ApplicationDetail } from "./ApplicationDetail";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Loads via GET /api/v1/applications/:id,
// status changes via PUT to the same, deletion via DELETE.
export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationDetail applicationId={id} />;
}
