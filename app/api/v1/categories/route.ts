import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import {
  createCategoryBodySchema,
  listCategoriesQuerySchema,
} from "@/lib/validators/category.validator";
import { createCategory, listCategories } from "@/lib/services/category.service";
import { activityActor, logCategoryCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/categories — admin only. ?isActive=true|false, ?q=, cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listCategories(parseQuery(req, listCategoriesQuerySchema)));
});

// POST /api/v1/categories — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const category = await createCategory(await parseJsonBody(req, createCategoryBodySchema));
  await logCategoryCreated(await activityActor(ctx.id), category);
  return jsonCreated(category);
});
