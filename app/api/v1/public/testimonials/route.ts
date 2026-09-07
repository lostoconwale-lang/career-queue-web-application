import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { listPublicTestimonials } from "@/lib/services/public-testimonial.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/public/testimonials — no auth. Active testimonials for the home
// page, served from the data cache and refreshed on any testimonial write.
export const GET = withRoute(async () => {
  return jsonOk(await listPublicTestimonials());
});
