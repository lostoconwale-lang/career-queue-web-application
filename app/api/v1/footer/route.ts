import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { updateFooterBodySchema } from "@/lib/validators/footer.validator";
import { getFooter, updateFooter } from "@/lib/services/footer.service";
import { revalidatePublicFooter } from "@/lib/services/public-footer.service";
import { activityActor, logFooterUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/footer — admin only. The site's footer link columns.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getFooter());
});

// PUT /api/v1/footer — admin only. Replaces the whole record.
export const PUT = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const footer = await updateFooter(await parseJsonBody(req, updateFooterBodySchema));
  revalidatePublicFooter();
  await logFooterUpdated(await activityActor(ctx.id));
  return jsonOk(footer);
});
