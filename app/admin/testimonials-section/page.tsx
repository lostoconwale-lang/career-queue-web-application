import { TestimonialsSectionForm } from "./TestimonialsSectionForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/testimonials-section (admin-only).
export default function TestimonialsSectionPage() {
  return <TestimonialsSectionForm />;
}
