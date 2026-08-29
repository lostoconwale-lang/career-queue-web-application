import { TestimonialForm } from "../../TestimonialForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Loads via GET /api/v1/testimonials/:id,
// submits PUT to the same.
export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestimonialForm testimonialId={id} />;
}
