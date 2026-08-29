import "server-only";
import { Types } from "mongoose";

import { NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { mediaUrl } from "@/lib/media";
import { normalizeSearchText } from "@/lib/models/searchable";
import { Testimonial, type TestimonialHydrated } from "@/lib/models/testimonial.model";
import type {
  CreateTestimonialBody,
  ListTestimonialsQuery,
  UpdateTestimonialBody,
} from "@/lib/validators/testimonial.validator";
import type { CursorPage } from "@/types/api";
import type { TestimonialDTO } from "@/types/testimonial";

export function toTestimonialDTO(t: TestimonialHydrated): TestimonialDTO {
  return {
    id: t._id.toString(),
    authorName: t.authorName,
    role: t.role,
    quote: t.quote,
    rating: t.rating,
    image: { id: t.image._id.toString(), key: t.image.key, url: mediaUrl(t.image.key) },
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function getTestimonialById(id: string): Promise<TestimonialDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Testimonial");
  const doc = await Testimonial.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Testimonial");
  return toTestimonialDTO(doc);
}

export async function listTestimonials(
  query: ListTestimonialsQuery,
): Promise<CursorPage<TestimonialDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await Testimonial.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toTestimonialDTO), query.limit);
}

export async function createTestimonial(body: CreateTestimonialBody): Promise<TestimonialDTO> {
  const doc = await Testimonial.create({
    authorName: body.authorName,
    role: body.role,
    quote: body.quote,
    rating: body.rating,
    image: body.image,
  });
  return toTestimonialDTO(doc);
}

export async function updateTestimonial(
  id: string,
  patch: UpdateTestimonialBody,
): Promise<TestimonialDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Testimonial");
  const doc = await Testimonial.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Testimonial");

  if (patch.authorName !== undefined) doc.authorName = patch.authorName;
  if (patch.role !== undefined) doc.role = patch.role;
  if (patch.quote !== undefined) doc.quote = patch.quote;
  if (patch.rating !== undefined) doc.rating = patch.rating;
  if (patch.image !== undefined) doc.set("image", patch.image);
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;

  await doc.save();
  return toTestimonialDTO(doc);
}

export async function deleteTestimonial(id: string): Promise<TestimonialDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Testimonial");
  const doc = await Testimonial.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Testimonial");

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();
  return toTestimonialDTO(doc);
}
