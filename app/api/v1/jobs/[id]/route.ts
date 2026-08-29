import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateJobBodySchema } from "@/lib/validators/job.validator";
import { deleteJob, getJobById, updateJob } from "@/lib/services/job.service";
import { activityActor, logJobDeleted, logJobUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid job id");
  return parsed.data;
}

// GET /api/v1/jobs/:id — admin only. Backs the edit page.
export const GET = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getJobById(parseId(params)));
});

// PUT /api/v1/jobs/:id — admin only.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateJobBodySchema);
  const job = await updateJob(parseId(params), patch);
  await logJobUpdated(await activityActor(ctx.id), job, patch);
  return jsonOk(job);
});

// DELETE /api/v1/jobs/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const job = await deleteJob(parseId(params));
  await logJobDeleted(await activityActor(ctx.id), job);
  return jsonNoContent();
});
