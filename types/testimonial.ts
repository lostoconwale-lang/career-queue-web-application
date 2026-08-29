import type { EmbeddedMediaDTO } from "@/types/media";

export interface TestimonialDTO {
  id: string;
  authorName: string;
  role: string;
  quote: string;
  rating: number; // 1–5
  image: EmbeddedMediaDTO;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
