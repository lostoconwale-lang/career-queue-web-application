import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { createFaqBodySchema, listFaqsQuerySchema } from "@/lib/validators/faq.validator";
import { createFaq, listFaqs } from "@/lib/services/faq.service";
import { activityActor, logFaqCreated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/faqs — admin only. ?isActive=true|false, ?q=.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listFaqs(parseQuery(req, listFaqsQuerySchema)));
});

// POST /api/v1/faqs — admin only.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const faq = await createFaq(await parseJsonBody(req, createFaqBodySchema));
  await logFaqCreated(await activityActor(ctx.id), faq);
  return jsonCreated(faq);
});
