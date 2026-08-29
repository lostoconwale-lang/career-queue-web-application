import { type NextRequest } from "next/server";

import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { adminOverview } from "@/lib/services/admin.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/admin/overview — signed-in admin only. Dashboard summary.
export const GET = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  return jsonOk(await adminOverview(ctx.id));
});
