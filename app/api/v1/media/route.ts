import { type NextRequest } from "next/server";

import { withRoute, parseQuery } from "@/lib/api/route-handler";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/authenticate";
import { requireAdmin } from "@/lib/auth/guards";
import { listMediaQuerySchema } from "@/lib/validators/media.validator";
import { listMedia, uploadFiles } from "@/lib/services/media.service";
import { activityActor, logMediaUploaded } from "@/lib/services/activity-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/media — admin only. ?fileType= / ?tag= / ?q= / cursor pagination.
export const GET = withRoute(async (req: NextRequest) => {
  requireAdmin(await requireAuth(req));
  return jsonOk(await listMedia(parseQuery(req, listMediaQuerySchema)));
});

// POST /api/v1/media — admin only. multipart/form-data: repeated `files`, repeated `tags`.
export const POST = withRoute(async (req: NextRequest) => {
  const ctx = await requireAuth(req);
  requireAdmin(ctx);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new BadRequestError("Expected multipart/form-data");
  }

  const files = form.getAll("files").filter((v): v is File => v instanceof File);
  const tags = form.getAll("tags").filter((v): v is string => typeof v === "string");
  const media = await uploadFiles(files, tags, ctx.id);
  await logMediaUploaded(await activityActor(ctx.id), media.length);
  return jsonCreated(media);
});
