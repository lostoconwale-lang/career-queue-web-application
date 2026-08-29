import { type NextRequest } from "next/server";

import { requireAuth } from "@/lib/auth/authenticate";
import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { completeProfileBodySchema } from "@/lib/validators/auth.validator";
import { completeProfile } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/complete-profile — step 2 of Google sign-up: attach a mobile number.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  const body = await parseJsonBody(req, completeProfileBodySchema);
  return jsonOk(await completeProfile(ctx.id, body.phone));
});
