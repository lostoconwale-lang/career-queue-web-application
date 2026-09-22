import { type NextRequest } from "next/server";

import { withRoute } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { getUserById } from "@/lib/services/user.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/users/me — the signed-in user's own profile.
export const GET = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  if (ctx.kind !== "user") throw new ForbiddenError("User access required");

  const user = await getUserById(ctx.id);
  if (!user) throw new NotFoundError("User");
  return jsonOk(user);
});
