import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import {
  createJobApplicationBodySchema,
  listJobApplicationsQuerySchema,
} from "@/lib/validators/job-application.validator";
import { createJobApplication, listJobApplications } from "@/lib/services/job-application.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/applications — admin only. ?status=&categoryId=&jobTypeId=&jobId=&q=, cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listJobApplications(parseQuery(req, listJobApplicationsQuerySchema)));
});

// POST /api/v1/applications — any logged-in user. Applies to a job as themselves.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  const application = await createJobApplication(
    ctx.id,
    await parseJsonBody(req, createJobApplicationBodySchema),
  );
  return jsonCreated(application);
});
