import { z } from "zod";

import { objectIdSchema } from "@/lib/validators/common";
import { SITE_ROUTES } from "@/lib/site-routes";
import { FOOTER_LINKS_PER_SECTION_MAX, FOOTER_SECTIONS_COUNT } from "@/types/footer";

const KNOWN_ROUTE_PATHS = new Set(SITE_ROUTES.map((r) => r.path));

const footerLinkBodySchema = z
  .object({
    label: z.string().trim().min(1, "Enter a label").max(40, "Label is too long"),
    targetType: z.enum(["route", "page"]),
    routePath: z.string().trim().optional(),
    pageId: objectIdSchema.optional(),
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

const footerSectionBodySchema = z.object({
  heading: z.string().trim().min(1, "Enter a heading").max(40, "Heading is too long"),
  links: z
    .array(footerLinkBodySchema)
    .max(FOOTER_LINKS_PER_SECTION_MAX, `At most ${FOOTER_LINKS_PER_SECTION_MAX} links per section`),
});

// PUT /api/v1/footer — the whole record is replaced. Exactly two sections,
// matching the two link columns in the footer UI.
export const updateFooterBodySchema = z.object({
  sections: z
    .array(footerSectionBodySchema)
    .length(FOOTER_SECTIONS_COUNT, `Provide exactly ${FOOTER_SECTIONS_COUNT} sections`),
});
export type UpdateFooterBody = z.infer<typeof updateFooterBodySchema>;
