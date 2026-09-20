import "server-only";
import { Types } from "mongoose";

import { BadRequestError } from "@/lib/api/errors";
import { Footer, FOOTER_KEY, type FooterHydrated } from "@/lib/models/footer.model";
import { StaticPage } from "@/lib/models/static-pages.model";
import type { UpdateFooterBody } from "@/lib/validators/footer.validator";
import type { FooterDTO, FooterLinkDTO, FooterSectionDTO } from "@/types/footer";

// The two link columns, seeded with their default (empty) headings on first access.
const DEFAULT_SECTIONS = [
  { heading: "Product", links: [] },
  { heading: "Company", links: [] },
];

// Load the singleton, creating it (with its default sections) on first access.
async function loadOrCreate(): Promise<FooterHydrated> {
  // Atomic upsert so concurrent first-time reads can't race to create two rows.
  const doc = await Footer.findOneAndUpdate(
    { key: FOOTER_KEY },
    { $setOnInsert: { key: FOOTER_KEY, sections: DEFAULT_SECTIONS } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!doc) throw new Error("Failed to load the footer");
  return doc;
}

async function toDTO(doc: FooterHydrated): Promise<FooterDTO> {
  const pageIds = doc.sections
    .flatMap((s) => s.links)
    .filter((l) => l.targetType === "page" && l.pageId)
    .map((l) => l.pageId as Types.ObjectId);
  const pages = pageIds.length
    ? await StaticPage.find({ _id: { $in: pageIds }, isDeleted: false }).select("title slug")
    : [];
  const byId = new Map(pages.map((p) => [p._id.toString(), p]));

  const sections: FooterSectionDTO[] = doc.sections.map((section) => ({
    id: section._id.toString(),
    heading: section.heading,
    // Preserve the admin's chosen order; silently drop any link whose page no
    // longer resolves (deleted after the link was created).
    links: section.links
      .map((l): FooterLinkDTO | null => {
        if (l.targetType === "route") {
          if (!l.routePath) return null;
          return {
            id: l._id.toString(),
            label: l.label,
            target: { type: "route", path: l.routePath },
            isActive: l.isActive,
          };
        }
        const page = l.pageId ? byId.get(l.pageId.toString()) : undefined;
        if (!page) return null;
        return {
          id: l._id.toString(),
          label: l.label,
          target: { type: "page", pageId: page._id.toString(), slug: page.slug, title: page.title },
          isActive: l.isActive,
        };
      })
      .filter((l): l is FooterLinkDTO => l !== null),
  }));

  return { sections, updatedAt: doc.updatedAt.toISOString() };
}

export async function getFooter(): Promise<FooterDTO> {
  return toDTO(await loadOrCreate());
}

export async function updateFooter(body: UpdateFooterBody): Promise<FooterDTO> {
  const doc = await loadOrCreate();

  const pageIds = body.sections
    .flatMap((s) => s.links)
    .filter((l) => l.targetType === "page")
    .map((l) => l.pageId as string);
  if (pageIds.length > 0) {
    const count = await StaticPage.countDocuments({ _id: { $in: pageIds }, isDeleted: false });
    if (count !== new Set(pageIds).size) {
      throw new BadRequestError("One of the selected pages no longer exists");
    }
  }

  doc.set(
    "sections",
    body.sections.map((section) => ({
      heading: section.heading,
      links: section.links.map((l) => ({
        label: l.label,
        targetType: l.targetType,
        routePath: l.targetType === "route" ? l.routePath : null,
        pageId: l.targetType === "page" ? new Types.ObjectId(l.pageId) : null,
        isActive: l.isActive,
      })),
    })),
  );
  await doc.save();
  return toDTO(doc);
}
