import type { EmbeddedMediaDTO } from "@/types/media";

// The marquee can comfortably hold more than a bounded grid would.
export const TESTIMONIALS_SECTION_LIMIT = 12;

export interface TestimonialRef {
  id: string;
  authorName: string;
  role: string;
  quote: string;
  image: EmbeddedMediaDTO;
}

// GET/PUT /api/v1/testimonials-section — the heading and the testimonials
// admins picked to feature on the home page, in the order they'll appear.
export interface TestimonialsSectionDTO {
  heading: string;
  testimonials: TestimonialRef[];
  updatedAt: string;
}
