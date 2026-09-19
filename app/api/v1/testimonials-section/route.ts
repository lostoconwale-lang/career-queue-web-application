import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { updateTestimonialsSectionBodySchema } from "@/lib/validators/testimonials-section.validator";
import {
  getTestimonialsSection,
  updateTestimonialsSection,
} from "@/lib/services/testimonials-section.service";
import { revalidatePublicTestimonials } from "@/lib/services/public-testimonial.service";
import { activityActor, logTestimonialsSectionUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/testimonials-section — admin only. The home page heading and
// the testimonials featured there.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getTestimonialsSection());
});

// PUT /api/v1/testimonials-section — admin only. Replaces the whole record.
export const PUT = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const section = await updateTestimonialsSection(
    await parseJsonBody(req, updateTestimonialsSectionBodySchema),
  );
  revalidatePublicTestimonials();
  await logTestimonialsSectionUpdated(await activityActor(ctx.id));
  return jsonOk(section);
});
