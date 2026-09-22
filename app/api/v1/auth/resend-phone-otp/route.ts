import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { resendPhoneOtpBodySchema } from "@/lib/validators/auth.validator";
import { resendPhoneOtp } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/resend-phone-otp — always reports success so this can't
// be used to check whether an email or mobile number has an account.
export const POST = withRoute(async (req: NextRequest) => {
  const body = await parseJsonBody(req, resendPhoneOtpBodySchema);
  await resendPhoneOtp(body);
  return jsonOk({ sent: true });
});
