import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonCreated } from "@/lib/api/response";
import { registerBodySchema } from "@/lib/validators/auth.validator";
import { registerUser } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/register — public website sign-up.
export const POST = withRoute(async (req: NextRequest) => {
  const body = await parseJsonBody(req, registerBodySchema);
  return jsonCreated(await registerUser(body));
});
