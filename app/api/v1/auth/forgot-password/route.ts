import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { forgotPasswordBodySchema } from "@/lib/validators/auth.validator";
import { requestPasswordReset } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/forgot-password — always reports success so this can't be
// used to check whether an email address has an account.
export const POST = withRoute(async (req: NextRequest) => {
  const { email } = await parseJsonBody(req, forgotPasswordBodySchema);
  await requestPasswordReset(email);
  return jsonOk({ sent: true });
});
