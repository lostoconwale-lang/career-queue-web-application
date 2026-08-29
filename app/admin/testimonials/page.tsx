import { TestimonialList } from "./TestimonialList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/testimonials and /api/v1/testimonials/:id (admin-only).
export default function TestimonialsPage() {
  return <TestimonialList />;
}
