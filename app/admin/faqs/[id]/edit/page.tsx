import { FaqForm } from "../../FaqForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Loads via GET /api/v1/faqs/:id,
// submits PUT to the same.
export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FaqForm faqId={id} />;
}
