import { type NextRequest } from "next/server";

import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { getJobFilterOptions } from "@/lib/services/public-job.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/public/job-filters — any logged-in user (not admin-gated,
// hence the "public" path — kept for URL stability). Active categories and
// job types, each with a live count of matching active jobs.
export const GET = withRoute(async (req: NextRequest) => {
  await requireAuth(req);
  return jsonOk(await getJobFilterOptions());
});
