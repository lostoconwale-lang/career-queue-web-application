import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { listPublicFaqs } from "@/lib/services/public-faq.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/public/faqs — no auth. Active FAQ entries for the home page,
// served from the data cache and refreshed on any FAQ write.
export const GET = withRoute(async () => {
  return jsonOk(await listPublicFaqs());
});
