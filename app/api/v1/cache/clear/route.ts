import { revalidateTag } from "next/cache";
import { type NextRequest } from "next/server";

import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { activityActor, logCacheCleared } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/cache/clear — admin only. Clears every public page cache, for
// the rare case a page still looks stale after an edit.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  for (const tag of Object.values(CACHE_TAGS)) revalidateTag(tag, "max");
  await logCacheCleared(await activityActor(ctx.id));
  return jsonOk({ cleared: Object.values(CACHE_TAGS).length });
});
