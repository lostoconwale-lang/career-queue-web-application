import { type NextRequest } from "next/server";

import { withRoute, parseQuery } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { publicJobsQuerySchema } from "@/lib/validators/public-job.validator";
import { listPublicJobs } from "@/lib/services/public-job.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/public/jobs — any logged-in user (not admin-gated, hence the
// "public" path — kept for URL stability). Active jobs only.
// ?q=&categories=<id>,<id>&types=<id>,<id>&page=&limit=
export const GET = withRoute(async (req: NextRequest) => {
  await requireAuth(req);
  return jsonOk(await listPublicJobs(parseQuery(req, publicJobsQuerySchema)));
});
