import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import {
  createStaticPageBodySchema,
  listStaticPagesQuerySchema,
} from "@/lib/validators/static-pages.validator";
import { createStaticPage, listStaticPages } from "@/lib/services/static-pages.service";
import { activityActor, logStaticPageCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/static-pages — admin only. ?isActive=true|false, ?q=, cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listStaticPages(parseQuery(req, listStaticPagesQuerySchema)));
});

// POST /api/v1/static-pages — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const page = await createStaticPage(await parseJsonBody(req, createStaticPageBodySchema));
  await logStaticPageCreated(await activityActor(ctx.id), page);
  return jsonCreated(page);
});
