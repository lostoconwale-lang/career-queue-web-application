import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { objectIdSchema } from "@/lib/validators/common";
import { updateAlertBodySchema } from "@/lib/validators/alert.validator";
import { markAlertRead } from "@/lib/services/alert.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

// PUT /api/v1/admin/alerts/:id — mark read/unread.
export const PUT = withRoute<Params>(async (req, { params }) => {
  requireAdmin(await requireAuth(req));
  const parsed = objectIdSchema.safeParse(params.id);
  if (!parsed.success) throw new BadRequestError("Invalid alert id");

  const { read } = await parseJsonBody(req, updateAlertBodySchema);
  return jsonOk(await markAlertRead(parsed.data, read));
});
