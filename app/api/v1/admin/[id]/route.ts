import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateAdminBodySchema } from "@/lib/validators/admin.validator";
import { updateAdmin } from "@/lib/services/admin.service";
import { activityActor, logAdminUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

// PUT /api/v1/admin/:id — admin only. Approve and/or (de)activate another admin.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const id = objectIdSchema.safeParse(params.id);
  if (!id.success) throw new BadRequestError("Invalid admin id");

  const patch = await parseJsonBody(req, updateAdminBodySchema);
  const admin = await updateAdmin(id.data, patch);
  await logAdminUpdated(await activityActor(ctx.id), admin, patch);
  return jsonOk(admin);
});
