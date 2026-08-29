import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateJobTypeBodySchema } from "@/lib/validators/job-type.validator";
import { deleteJobType, getJobTypeById, updateJobType } from "@/lib/services/job-type.service";
import {
  activityActor,
  logJobTypeDeleted,
  logJobTypeUpdated,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid job type id");
  return parsed.data;
}

// GET /api/v1/job-types/:id — admin only. Backs the edit page.
export const GET = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getJobTypeById(parseId(params)));
});

// PUT /api/v1/job-types/:id — admin only.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateJobTypeBodySchema);
  const jobType = await updateJobType(parseId(params), patch);
  await logJobTypeUpdated(await activityActor(ctx.id), jobType, patch);
  return jsonOk(jobType);
});

// DELETE /api/v1/job-types/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const jobType = await deleteJobType(parseId(params));
  await logJobTypeDeleted(await activityActor(ctx.id), jobType);
  return jsonNoContent();
});
