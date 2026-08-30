import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateJobApplicationBodySchema } from "@/lib/validators/job-application.validator";
import {
  deleteJobApplication,
  getJobApplicationById,
  updateJobApplication,
} from "@/lib/services/job-application.service";
import {
  activityActor,
  logJobApplicationDeleted,
  logJobApplicationUpdated,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid application id");
  return parsed.data;
}

// GET /api/v1/applications/:id — admin only.
export const GET = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getJobApplicationById(parseId(params)));
});

// PUT /api/v1/applications/:id — admin only. Move it through the review pipeline.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const patch = await parseJsonBody(req, updateJobApplicationBodySchema);
  const application = await updateJobApplication(parseId(params), patch);
  await logJobApplicationUpdated(await activityActor(ctx.id), application, patch);
  return jsonOk(application);
});

// DELETE /api/v1/applications/:id — admin only. Soft delete.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const application = await deleteJobApplication(parseId(params));
  await logJobApplicationDeleted(await activityActor(ctx.id), application);
  return jsonNoContent();
});
