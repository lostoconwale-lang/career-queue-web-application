import { FooterForm } from "./FooterForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/footer (admin-only).
export default function FooterPage() {
  return <FooterForm />;
}
