import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { createCityBodySchema, listCitiesQuerySchema } from "@/lib/validators/city.validator";
import { createCity, listCities } from "@/lib/services/city.service";
import { revalidatePublicCities } from "@/lib/services/public-city.service";
import { activityActor, logCityCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/cities — admin only. ?isActive=true|false, ?q=, cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listCities(parseQuery(req, listCitiesQuerySchema)));
});

// POST /api/v1/cities — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const city = await createCity(await parseJsonBody(req, createCityBodySchema));
  revalidatePublicCities();
  await logCityCreated(await activityActor(ctx.id), city);
  return jsonCreated(city);
});
