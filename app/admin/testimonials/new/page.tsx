import { TestimonialForm } from "../TestimonialForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Submits POST /api/v1/testimonials.
export default function NewTestimonialPage() {
  return <TestimonialForm />;
}
