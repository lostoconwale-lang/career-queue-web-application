import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { loginBodySchema } from "@/lib/validators/auth.validator";
import { login } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/login — website users. Body: { email, password }.
export const POST = withRoute(async (req: NextRequest) => {
  const body = await parseJsonBody(req, loginBodySchema);
  return jsonOk(await login(body));
});
