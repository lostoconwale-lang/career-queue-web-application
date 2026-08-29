import { FaqForm } from "../FaqForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Submits POST /api/v1/faqs.
export default function NewFaqPage() {
  return <FaqForm />;
}
