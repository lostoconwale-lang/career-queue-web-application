import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateTestimonialBodySchema } from "@/lib/validators/testimonial.validator";
import {
  deleteTestimonial,
  getTestimonialById,
  updateTestimonial,
} from "@/lib/services/testimonial.service";
import {
  activityActor,
  logTestimonialDeleted,
  logTestimonialUpdated,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid testimonial id");
  return parsed.data;
}

// GET /api/v1/testimonials/:id — admin only. Backs the edit page.
export const GET = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getTestimonialById(parseId(params)));
});

// PUT /api/v1/testimonials/:id — admin only.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateTestimonialBodySchema);
  const testimonial = await updateTestimonial(parseId(params), patch);
  await logTestimonialUpdated(await activityActor(ctx.id), testimonial, patch);
  return jsonOk(testimonial);
});

// DELETE /api/v1/testimonials/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const testimonial = await deleteTestimonial(parseId(params));
  await logTestimonialDeleted(await activityActor(ctx.id), testimonial);
  return jsonNoContent();
});
