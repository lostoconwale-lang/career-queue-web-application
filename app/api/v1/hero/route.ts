import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { updateHeroBodySchema } from "@/lib/validators/hero.validator";
import { getHero, updateHero } from "@/lib/services/hero.service";
import { revalidatePublicHero } from "@/lib/services/public-hero.service";
import { activityActor, logHeroUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/hero — admin only. The home page hero content.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getHero());
});

// PUT /api/v1/hero — admin only. Replaces the whole record.
export const PUT = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const hero = await updateHero(await parseJsonBody(req, updateHeroBodySchema));
  revalidatePublicHero();
  await logHeroUpdated(await activityActor(ctx.id));
  return jsonOk(hero);
});
