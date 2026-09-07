import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { listPublicCities } from "@/lib/services/public-city.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/public/cities — no auth. Active cities for the search menus,
// served from the data cache and refreshed on any city write.
export const GET = withRoute(async () => {
  return jsonOk(await listPublicCities());
});
