import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { verifyPhoneOtpBodySchema } from "@/lib/validators/auth.validator";
import { verifyPhoneOtp } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/verify-phone-otp — the registration OTP step, and the
// login-time popup for accounts that predate this gate.
export const POST = withRoute(async (req: NextRequest) => {
  const body = await parseJsonBody(req, verifyPhoneOtpBodySchema);
  await verifyPhoneOtp(body);
  return jsonOk({ verified: true });
});
