import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { refreshBodySchema } from "@/lib/validators/auth.validator";
import { refresh } from "@/lib/services/auth.service";

export const runtime = "nodejs";

// POST /api/v1/auth/refresh — body: { refreshToken }
export const POST = withRoute(async (req: NextRequest) => {
  const { refreshToken } = await parseJsonBody(req, refreshBodySchema);
  return jsonOk({ tokens: await refresh(refreshToken) });
});
