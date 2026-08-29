import { type NextRequest } from "next/server";

import { withRoute, parseQuery } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { listActivityLogsQuerySchema } from "@/lib/validators/activity-log.validator";
import { listActivityLogs } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/admin/activity — admin only. Filter with ?category= / ?type=, search ?q=.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listActivityLogs(parseQuery(req, listActivityLogsQuerySchema)));
});
