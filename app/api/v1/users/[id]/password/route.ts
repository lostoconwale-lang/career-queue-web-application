import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { setUserPasswordBodySchema } from "@/lib/validators/user.validator";
import { setUserPassword } from "@/lib/services/user.service";
import { activityActor, logUserPasswordSet } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

// PUT /api/v1/users/:id/password — admin only. Set a new password for a user.
export const PUT = withRoute<Params>(async (req, { params }) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const id = objectIdSchema.safeParse(params.id);
  if (!id.success) throw new BadRequestError("Invalid user id");

  const { password } = await parseJsonBody(req, setUserPasswordBodySchema);
  const user = await setUserPassword(id.data, password);
  await logUserPasswordSet(await activityActor(ctx.id), user);
  return jsonOk(user);
});
