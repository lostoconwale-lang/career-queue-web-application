import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateFaqBodySchema } from "@/lib/validators/faq.validator";
import { deleteFaq, getFaqById, updateFaq } from "@/lib/services/faq.service";
import { activityActor, logFaqDeleted, logFaqUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid FAQ id");
  return parsed.data;
}

// GET /api/v1/faqs/:id — admin only. Backs the edit page.
export const GET = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getFaqById(parseId(params)));
});

// PUT /api/v1/faqs/:id — admin only.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateFaqBodySchema);
  const faq = await updateFaq(parseId(params), patch);
  await logFaqUpdated(await activityActor(ctx.id), faq, patch);
  return jsonOk(faq);
});

// DELETE /api/v1/faqs/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const faq = await deleteFaq(parseId(params));
  await logFaqDeleted(await activityActor(ctx.id), faq);
  return jsonNoContent();
});
