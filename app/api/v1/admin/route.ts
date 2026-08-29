import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminBodySchema, listAdminsQuerySchema } from "@/lib/validators/admin.validator";
import { createAdmin, listAdmins } from "@/lib/services/admin.service";
import { activityActor, logAdminCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/admin — admin only. Filter pending approvals with ?adminApproved=false.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listAdmins(parseQuery(req, listAdminsQuerySchema)));
});

// POST /api/v1/admin — admin only. Creates another admin, already approved + active.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const admin = await createAdmin(await parseJsonBody(req, createAdminBodySchema));
  await logAdminCreated(await activityActor(ctx.id), admin);
  return jsonCreated(admin);
});
