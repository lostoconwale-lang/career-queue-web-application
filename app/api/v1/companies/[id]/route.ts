import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateCompanyBodySchema } from "@/lib/validators/company.validator";
import {
  deleteCompany,
  getCompanyById,
  updateCompany,
} from "@/lib/services/company.service";
import {
  activityActor,
  logCompanyDeleted,
  logCompanyUpdated,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid company id");
  return parsed.data;
}

// GET /api/v1/companies/:id — admin only. Backs the edit page.
export const GET = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getCompanyById(parseId(params)));
});

// PUT /api/v1/companies/:id — admin only. Rename, toggle active, edit description/website/logo.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateCompanyBodySchema);
  const company = await updateCompany(parseId(params), patch);
  await logCompanyUpdated(await activityActor(ctx.id), company, patch);
  return jsonOk(company);
});

// DELETE /api/v1/companies/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const company = await deleteCompany(parseId(params));
  await logCompanyDeleted(await activityActor(ctx.id), company);
  return jsonNoContent();
});
