import { HowItWorksForm } from "./HowItWorksForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/how-it-works (admin-only).
export default function HowItWorksPage() {
  return <HowItWorksForm />;
}
