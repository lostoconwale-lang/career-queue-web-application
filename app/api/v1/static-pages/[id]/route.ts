import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateStaticPageBodySchema } from "@/lib/validators/static-pages.validator";
import {
  deleteStaticPage,
  getStaticPageById,
  updateStaticPage,
} from "@/lib/services/static-pages.service";
import {
  activityActor,
  logStaticPageDeleted,
  logStaticPageUpdated,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid page id");
  return parsed.data;
}

// GET /api/v1/static-pages/:id — admin only. Backs the edit page.
export const GET = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getStaticPageById(parseId(params)));
});

// PUT /api/v1/static-pages/:id — admin only.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateStaticPageBodySchema);
  const page = await updateStaticPage(parseId(params), patch);
  await logStaticPageUpdated(await activityActor(ctx.id), page, patch);
  return jsonOk(page);
});

// DELETE /api/v1/static-pages/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const page = await deleteStaticPage(parseId(params));
  await logStaticPageDeleted(await activityActor(ctx.id), page);
  return jsonNoContent();
});
