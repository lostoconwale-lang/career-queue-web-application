import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { verifyEmailBodySchema } from "@/lib/validators/auth.validator";
import { verifyEmailToken } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/verify-email — called by app/(auth)/verify-email/page.tsx
// with the token from the emailed link.
export const POST = withRoute(async (req: NextRequest) => {
  const { token } = await parseJsonBody(req, verifyEmailBodySchema);
  await verifyEmailToken(token);
  return jsonOk({ verified: true });
});
