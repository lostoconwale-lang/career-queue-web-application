import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { updateSettingsBodySchema } from "@/lib/validators/settings.validator";
import { getSettings, updateSettings } from "@/lib/services/settings.service";
import { activityActor, logSettingsUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/settings — admin only. The single site-wide settings record.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getSettings());
});

// PUT /api/v1/settings — admin only. Replaces the whole record.
export const PUT = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const settings = await updateSettings(await parseJsonBody(req, updateSettingsBodySchema));
  await logSettingsUpdated(await activityActor(ctx.id));
  return jsonOk(settings);
});
