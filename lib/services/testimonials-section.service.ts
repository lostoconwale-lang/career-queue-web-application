import "server-only";
import { Types } from "mongoose";

import { BadRequestError } from "@/lib/api/errors";
import { mediaUrl } from "@/lib/media";
import { Testimonial } from "@/lib/models/testimonial.model";
import {
  TestimonialsSection,
  TESTIMONIALS_SECTION_KEY,
  type TestimonialsSectionHydrated,
} from "@/lib/models/testimonials-section.model";
import type { UpdateTestimonialsSectionBody } from "@/lib/validators/testimonials-section.validator";
import type { TestimonialRef, TestimonialsSectionDTO } from "@/types/testimonials-section";

// Load the singleton, creating it (with its default heading) on first access.
async function loadOrCreate(): Promise<TestimonialsSectionHydrated> {
  // Atomic upsert so concurrent first-time reads can't race to create two rows.
  const doc = await TestimonialsSection.findOneAndUpdate(
    { key: TESTIMONIALS_SECTION_KEY },
    { $setOnInsert: { key: TESTIMONIALS_SECTION_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!doc) throw new Error("Failed to load the testimonials section");
  return doc;
}

async function toDTO(doc: TestimonialsSectionHydrated): Promise<TestimonialsSectionDTO> {
  if (doc.testimonialIds.length === 0) {
    return { heading: doc.heading, testimonials: [], updatedAt: doc.updatedAt.toISOString() };
  }

  const docs = await Testimonial.find({
    _id: { $in: doc.testimonialIds },
    isDeleted: false,
  }).select("authorName role quote image");
  const byId = new Map(docs.map((t) => [t._id.toString(), t]));

  // Preserve the admin's chosen order; silently drop any id that no longer resolves.
  const resolved = doc.testimonialIds
    .map((id) => {
      const t = byId.get(id.toString());
      if (!t) return null;
      return {
        id: id.toString(),
        authorName: t.authorName,
        role: t.role,
        quote: t.quote,
        image: { id: t.image._id.toString(), key: t.image.key, url: mediaUrl(t.image.key) },
      };
    })
    .filter((t): t is TestimonialRef => t !== null);

  return { heading: doc.heading, testimonials: resolved, updatedAt: doc.updatedAt.toISOString() };
}

export async function getTestimonialsSection(): Promise<TestimonialsSectionDTO> {
  return toDTO(await loadOrCreate());
}

export async function updateTestimonialsSection(
  body: UpdateTestimonialsSectionBody,
): Promise<TestimonialsSectionDTO> {
  const doc = await loadOrCreate();

  if (body.testimonialIds.length > 0) {
    const count = await Testimonial.countDocuments({
      _id: { $in: body.testimonialIds },
      isDeleted: false,
    });
    if (count !== body.testimonialIds.length) {
      throw new BadRequestError("One of the selected testimonials no longer exists");
    }
  }

  doc.heading = body.heading;
  doc.testimonialIds = body.testimonialIds.map((id) => new Types.ObjectId(id));
  await doc.save();
  return toDTO(doc);
}
