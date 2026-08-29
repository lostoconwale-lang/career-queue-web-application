import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonNoContent, jsonOk } from "@/lib/api/response";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin, requireSelfOrAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateSelfBodySchema, updateUserBodySchema } from "@/lib/validators/user.validator";
import { deleteUser, getUserById, updateUser } from "@/lib/services/user.service";
import {
  activityActor,
  logUserDeleted,
  logUserUpdated,
} from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

function parseId(params: Params): string {
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid user id");
  return parsed.data;
}

// GET /api/v1/users/:id — the user themselves, or an admin.
export const GET = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  const id = parseId(params);
  requireSelfOrAdmin(ctx, id);

  const user = await getUserById(id);
  if (!user) throw new NotFoundError("User");
  return jsonOk(user);
});

// PUT /api/v1/users/:id — user: name/phone/email; admin: also status.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  const id = parseId(params);
  requireSelfOrAdmin(ctx, id);

  if (ctx.kind === "admin") {
    const patch = await parseJsonBody(req, updateUserBodySchema);
    const user = await updateUser(id, patch);
    await logUserUpdated(await activityActor(ctx.id), user, patch);
    return jsonOk(user);
  }

  const patch = await parseJsonBody(req, updateSelfBodySchema);
  return jsonOk(await updateUser(id, patch));
});

// DELETE /api/v1/users/:id — admin only.
export const DELETE = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const user = await deleteUser(parseId(params));
  await logUserDeleted(await activityActor(ctx.id), user);
  return jsonNoContent();
});
