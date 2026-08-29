import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateCityBodySchema } from "@/lib/validators/city.validator";
import { deleteCity, updateCity } from "@/lib/services/city.service";
import {
  activityActor,
  logCityDeleted,
  logCityUpdated,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid city id");
  return parsed.data;
}

// PUT /api/v1/cities/:id — admin only. Rename and/or toggle active.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateCityBodySchema);
  const city = await updateCity(parseId(params), patch);
  await logCityUpdated(await activityActor(ctx.id), city, patch);
  return jsonOk(city);
});

// DELETE /api/v1/cities/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const city = await deleteCity(parseId(params));
  await logCityDeleted(await activityActor(ctx.id), city);
  return jsonNoContent();
});
