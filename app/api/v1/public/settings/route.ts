import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { listPublicSettings } from "@/lib/services/public-settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/public/settings — no auth. Settings fields shown to visitors,
// served from the data cache and refreshed on any settings write.
export const GET = withRoute(async () => {
  return jsonOk(await listPublicSettings());
});
