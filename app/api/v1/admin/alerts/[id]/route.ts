import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateAlertBodySchema } from "@/lib/validators/alert.validator";
import { markAlertRead } from "@/lib/services/alert.service";
import { activityActor } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

// PUT /api/v1/admin/alerts/:id — mark read/unread. Marking read records
// which admin did it (shown as "Read by" in the admin alerts list).
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid alert id");

  const { read } = await parseJsonBody(req, updateAlertBodySchema);
  const admin = await activityActor(ctx.id);
  return jsonOk(await markAlertRead(parsed.data, read, admin));
});
