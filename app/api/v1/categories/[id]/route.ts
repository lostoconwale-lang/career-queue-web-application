import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateCategoryBodySchema } from "@/lib/validators/category.validator";
import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/lib/services/category.service";
import { revalidatePublicPopularCategories } from "@/lib/services/public-popular-categories.service";
import {
  activityActor,
  logCategoryDeleted,
  logCategoryUpdated,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid category id");
  return parsed.data;
}

// GET /api/v1/categories/:id — admin only. Backs the edit page.
export const GET = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getCategoryById(parseId(params)));
});

// PUT /api/v1/categories/:id — admin only. Rename, toggle active, and/or edit SEO.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateCategoryBodySchema);
  const category = await updateCategory(parseId(params), patch);
  // A featured category's name, icon or active state may have just changed —
  // clear the home page's cached copy rather than wait for it to expire.
  revalidatePublicPopularCategories();
  await logCategoryUpdated(await activityActor(ctx.id), category, patch);
  return jsonOk(category);
});

// DELETE /api/v1/categories/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const category = await deleteCategory(parseId(params));
  revalidatePublicPopularCategories();
  await logCategoryDeleted(await activityActor(ctx.id), category);
  return jsonNoContent();
});
