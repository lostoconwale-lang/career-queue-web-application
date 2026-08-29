import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateMediaBodySchema } from "@/lib/validators/media.validator";
import { deleteMedia, updateMedia } from "@/lib/services/media.service";
import {
  activityActor,
  logMediaDeleted,
  logMediaTagged,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid file id");
  return parsed.data;
}

// PUT /api/v1/media/:id — admin only. Replace the file's tags.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const { tags } = await parseJsonBody(req, updateMediaBodySchema);
  const file = await updateMedia(parseId(params), tags);
  await logMediaTagged(await activityActor(ctx.id), file);
  return jsonOk(file);
});

// DELETE /api/v1/media/:id — admin only. Removes the DB row and the R2 object.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const file = await deleteMedia(parseId(params));
  await logMediaDeleted(await activityActor(ctx.id), file);
  return jsonNoContent();
});
