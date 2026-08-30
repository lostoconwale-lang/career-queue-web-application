import { type NextRequest } from "next/server";

import { withRoute, parseQuery } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { publicJobsQuerySchema } from "@/lib/validators/public-job.validator";
import { listPublicJobs } from "@/lib/services/public-job.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/public/jobs — public, no auth. Active jobs only.
// ?q=&categories=<id>,<id>&types=<id>,<id>&page=&limit=
export const GET = withRoute(async (req: NextRequest) => {
  return jsonOk(await listPublicJobs(parseQuery(req, publicJobsQuerySchema)));
});
