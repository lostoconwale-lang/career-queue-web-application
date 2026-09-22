import { type NextRequest } from "next/server";

import { withRoute, parseQuery } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { listAlertsQuerySchema } from "@/lib/validators/alert.validator";
import { listAlerts } from "@/lib/services/alert.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/admin/alerts
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listAlerts(parseQuery(req, listAlertsQuerySchema)));
});
