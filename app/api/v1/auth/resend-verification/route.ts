import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { resendVerificationBodySchema } from "@/lib/validators/auth.validator";
import { resendVerificationEmail } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/resend-verification — always reports success so this
// can't be used to check whether an email address has an account.
export const POST = withRoute(async (req: NextRequest) => {
  const { email } = await parseJsonBody(req, resendVerificationBodySchema);
  await resendVerificationEmail(email);
  return jsonOk({ sent: true });
});
