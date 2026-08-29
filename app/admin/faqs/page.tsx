import { FaqList } from "./FaqList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/faqs and /api/v1/faqs/:id (admin-only).
export default function FaqsPage() {
  return <FaqList />;
}
