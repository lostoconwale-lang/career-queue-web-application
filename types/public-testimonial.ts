// A testimonial as shown on the public home page — only what the card renders.
export interface PublicTestimonialDTO {
  id: string;
  authorName: string;
  role: string;
  quote: string;
  imageUrl: string;
}

// GET /api/v1/public/testimonials — the home page testimonials section.
export interface PublicTestimonialsDTO {
  heading: string;
  testimonials: PublicTestimonialDTO[];
}
