import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { getJobFilterOptions } from "@/lib/services/public-job.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/public/job-filters — public, no auth. Active categories and job
// types, each with a live count of matching active jobs.
export const GET = withRoute(async () => jsonOk(await getJobFilterOptions()));
