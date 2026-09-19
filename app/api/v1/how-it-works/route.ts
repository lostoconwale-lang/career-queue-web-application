import { type NextRequest } from "next/server";

import { withRoute, parseJsonBody } from "@/lib/api/route-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { updateHowItWorksBodySchema } from "@/lib/validators/how-it-works.validator";
import { getHowItWorks, updateHowItWorks } from "@/lib/services/how-it-works.service";
import { revalidatePublicHowItWorks } from "@/lib/services/public-how-it-works.service";
import { activityActor, logHowItWorksUpdated } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/how-it-works — admin only. The home page "How it works" content.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await getHowItWorks());
});

// PUT /api/v1/how-it-works — admin only. Replaces the whole record.
export const PUT = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);
  const howItWorks = await updateHowItWorks(
    await parseJsonBody(req, updateHowItWorksBodySchema),
  );
  revalidatePublicHowItWorks();
  await logHowItWorksUpdated(await activityActor(ctx.id));
  return jsonOk(howItWorks);
});
