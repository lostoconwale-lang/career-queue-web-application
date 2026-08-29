import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { createUserBodySchema, listUsersQuerySchema } from "@/lib/validators/user.validator";
import { createUser, listUsers } from "@/lib/services/user.service";
import { activityActor, logUserCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/users — admin only, paginated.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listUsers(parseQuery(req, listUsersQuerySchema)));
});

// POST /api/v1/users — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const user = await createUser(await parseJsonBody(req, createUserBodySchema));
  await logUserCreated(await activityActor(ctx.id), user);
  return jsonCreated(user);
});
