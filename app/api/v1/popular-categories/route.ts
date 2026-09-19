import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { updatePopularCategoriesBodySchema } from "@/lib/validators/popular-categories.validator";
import {
  getPopularCategories,
  updatePopularCategories,
} from "@/lib/services/popular-categories.service";
import { revalidatePublicPopularCategories } from "@/lib/services/public-popular-categories.service";
import { activityActor, logPopularCategoriesUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/popular-categories — admin only. The featured home page categories.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getPopularCategories());
});

// PUT /api/v1/popular-categories — admin only. Replaces the whole selection.
export const PUT = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const popularCategories = await updatePopularCategories(
    await parseJsonBody(req, updatePopularCategoriesBodySchema),
  );
  revalidatePublicPopularCategories();
  await logPopularCategoriesUpdated(await activityActor(ctx.id));
  return jsonOk(popularCategories);
});
