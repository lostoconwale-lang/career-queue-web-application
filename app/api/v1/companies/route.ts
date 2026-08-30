import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import {
  createCompanyBodySchema,
  listCompaniesQuerySchema,
} from "@/lib/validators/company.validator";
import { createCompany, listCompanies } from "@/lib/services/company.service";
import { activityActor, logCompanyCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/companies — admin only. ?isActive=true|false, ?q=, cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listCompanies(parseQuery(req, listCompaniesQuerySchema)));
});

// POST /api/v1/companies — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const company = await createCompany(await parseJsonBody(req, createCompanyBodySchema));
  await logCompanyCreated(await activityActor(ctx.id), company);
  return jsonCreated(company);
});
