import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { adminLoginBodySchema } from "@/lib/validators/admin.validator";
import { loginAdmin } from "@/lib/services/admin.service";
import { activityActor, logAdminLogin } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";

// POST /api/v1/admin/login — body: { email, password }. Only approved, active admins.
export const POST = withRoute(async (req: NextRequest) => {
  const body = await parseJsonBody(req, adminLoginBodySchema);
  const result = await loginAdmin(body);
  await logAdminLogin(await activityActor(result.identity.id));
  return jsonOk(result);
});
