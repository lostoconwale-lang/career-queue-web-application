import { type NextRequest } from "next/server";

import { withRoute, parseQuery } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { headerLinkOptionsQuerySchema } from "@/lib/validators/header.validator";
import { listHeaderLinkOptions } from "@/lib/services/header.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/header/link-options — admin only. ?q= searches both the known
// routes and the static pages, for the header link destination picker.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  const { q } = parseQuery(req, headerLinkOptionsQuerySchema);
  return jsonOk(await listHeaderLinkOptions(q));
});
