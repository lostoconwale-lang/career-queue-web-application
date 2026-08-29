import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonCreated } from "@/lib/api/response";
import { adminRegisterBodySchema } from "@/lib/validators/admin.validator";
import { registerAdmin } from "@/lib/services/admin.service";
import { logAdminRegistered } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";

// POST /api/v1/admin/register — public. Account stays locked until an existing
// admin approves it (adminApproved).
export const POST = withRoute(async (req: NextRequest) => {
  const body = await parseJsonBody(req, adminRegisterBodySchema);
  const result = await registerAdmin(body);
  await logAdminRegistered(result.admin);
  return jsonCreated(result);
});
