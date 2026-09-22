import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { resetPasswordBodySchema } from "@/lib/validators/auth.validator";
import { resetPassword } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/reset-password — the form at /reset-password calls this
// with the token from the emailed link plus the new password.
export const POST = withRoute(async (req: NextRequest) => {
  const { token, password } = await parseJsonBody(req, resetPasswordBodySchema);
  await resetPassword({ token, password });
  return jsonOk({ reset: true });
});
