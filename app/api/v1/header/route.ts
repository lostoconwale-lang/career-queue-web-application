import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { updateHeaderBodySchema } from "@/lib/validators/header.validator";
import { getHeader, updateHeader } from "@/lib/services/header.service";
import { revalidatePublicHeader } from "@/lib/services/public-header.service";
import { activityActor, logHeaderUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/header — admin only. The site's nav links.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getHeader());
});

// PUT /api/v1/header — admin only. Replaces the whole record.
export const PUT = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const header = await updateHeader(await parseJsonBody(req, updateHeaderBodySchema));
  revalidatePublicHeader();
  await logHeaderUpdated(await activityActor(ctx.id));
  return jsonOk(header);
});
