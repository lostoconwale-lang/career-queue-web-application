import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import {
  createJobTypeBodySchema,
  listJobTypesQuerySchema,
} from "@/lib/validators/job-type.validator";
import { createJobType, listJobTypes } from "@/lib/services/job-type.service";
import { activityActor, logJobTypeCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/job-types — admin only. ?isActive=true|false, ?q=, cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listJobTypes(parseQuery(req, listJobTypesQuerySchema)));
});

// POST /api/v1/job-types — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const jobType = await createJobType(await parseJsonBody(req, createJobTypeBodySchema));
  await logJobTypeCreated(await activityActor(ctx.id), jobType);
  return jsonCreated(jobType);
});
