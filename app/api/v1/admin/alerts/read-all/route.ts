import { type NextRequest } from "next/server";

import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { markAllAlertsRead } from "@/lib/services/alert.service";

export const runtime = "nodejs";

// POST /api/v1/admin/alerts/read-all
export const POST = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  await markAllAlertsRead();
  return jsonOk({ read: true });
});
