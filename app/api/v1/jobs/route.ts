import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { createJobBodySchema, listJobsQuerySchema } from "@/lib/validators/job.validator";
import { createJob, listJobs } from "@/lib/services/job.service";
import { activityActor, logJobCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/jobs — admin only. ?isActive=true|false, ?categoryId=, ?q=, cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listJobs(parseQuery(req, listJobsQuerySchema)));
});

// POST /api/v1/jobs — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const job = await createJob(await parseJsonBody(req, createJobBodySchema));
  await logJobCreated(await activityActor(ctx.id), job);
  return jsonCreated(job);
});
