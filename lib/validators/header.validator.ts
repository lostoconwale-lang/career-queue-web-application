import { z } from "zod";

import { objectIdSchema } from "@/lib/validators/common";
import { SITE_ROUTES } from "@/lib/site-routes";
import { HEADER_LINKS_MAX, HEADER_VISIBILITY } from "@/types/header";

const KNOWN_ROUTE_PATHS = new Set(SITE_ROUTES.map((r) => r.path));

const headerLinkBodySchema = z
  .object({
    label: z.string().trim().min(1, "Enter a label").max(40, "Label is too long"),
    targetType: z.enum(["route", "page"]),
    routePath: z.string().trim().optional(),
    pageId: objectIdSchema.optional(),
    visibility: z.enum(HEADER_VISIBILITY).default("all"),
    isActive: z.boolean().default(true),
  })
  .refine(
    (v) => v.targetType !== "route" || (!!v.routePath && KNOWN_ROUTE_PATHS.has(v.routePath)),
    {
      message: "Choose a valid route",
      path: ["routePath"],
    },
  )
  .refine((v) => v.targetType !== "page" || !!v.pageId, {
    message: "Choose a page",
    path: ["pageId"],
  });

// PUT /api/v1/header — the whole record is replaced, in the given order.
export const updateHeaderBodySchema = z.object({
  links: z.array(headerLinkBodySchema).max(HEADER_LINKS_MAX, `At most ${HEADER_LINKS_MAX} links`),
});
export type UpdateHeaderBody = z.infer<typeof updateHeaderBodySchema>;

// GET /api/v1/header/link-options
export const headerLinkOptionsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
});
export type HeaderLinkOptionsQuery = z.infer<typeof headerLinkOptionsQuerySchema>;
