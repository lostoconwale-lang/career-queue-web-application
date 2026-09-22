import { type NextRequest } from "next/server";

import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { countUnreadAlerts, listRecentAlerts } from "@/lib/services/alert.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/admin/alerts/unread-count — powers the header bell (badge +
// preview dropdown) and the sidebar badge, polled from AdminShell.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  const [count, recent] = await Promise.all([countUnreadAlerts(), listRecentAlerts(8)]);
  return jsonOk({ count, recent });
});
