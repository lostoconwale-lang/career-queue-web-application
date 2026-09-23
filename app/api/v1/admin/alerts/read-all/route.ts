import { type NextRequest } from "next/server";

import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { markAllAlertsRead } from "@/lib/services/alert.service";
import { activityActor } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";

// POST /api/v1/admin/alerts/read-all
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  await markAllAlertsRead(await activityActor(ctx.id));
  return jsonOk({ read: true });
});
