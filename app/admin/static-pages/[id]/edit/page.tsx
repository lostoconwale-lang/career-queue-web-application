import { StaticPageForm } from "../../StaticPageForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Loads via GET /api/v1/static-pages/:id,
// submits PUT to the same.
export default async function EditStaticPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaticPageForm pageId={id} />;
}
