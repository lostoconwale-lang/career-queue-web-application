import { type NextRequest } from "next/server";

import { withRoute, parseQuery } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { linkOptionsQuerySchema } from "@/lib/validators/link-options.validator";
import { listLinkOptions } from "@/lib/services/link-options.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/link-options — admin only. ?q= searches both the known routes
// and the static pages, for the header/footer link destination pickers.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  const { q } = parseQuery(req, linkOptionsQuerySchema);
  return jsonOk(await listLinkOptions(q));
});
