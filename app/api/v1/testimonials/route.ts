import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import {
  createTestimonialBodySchema,
  listTestimonialsQuerySchema,
} from "@/lib/validators/testimonial.validator";
import { createTestimonial, listTestimonials } from "@/lib/services/testimonial.service";
import { revalidatePublicTestimonials } from "@/lib/services/public-testimonial.service";
import { activityActor, logTestimonialCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/testimonials — admin only. ?isActive=true|false, ?q=, cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listTestimonials(parseQuery(req, listTestimonialsQuerySchema)));
});

// POST /api/v1/testimonials — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const testimonial = await createTestimonial(
    await parseJsonBody(req, createTestimonialBodySchema),
  );
  revalidatePublicTestimonials();
  await logTestimonialCreated(await activityActor(ctx.id), testimonial);
  return jsonCreated(testimonial);
});
