import "server-only";
import { Types } from "mongoose";

import { BadRequestError } from "@/lib/api/errors";
import { Header, HEADER_KEY, type HeaderHydrated } from "@/lib/models/header.model";
import { StaticPage } from "@/lib/models/static-pages.model";
import type { UpdateHeaderBody } from "@/lib/validators/header.validator";
import type { HeaderDTO, HeaderLinkDTO } from "@/types/header";

// Load the singleton, creating it (empty) on first access.
async function loadOrCreate(): Promise<HeaderHydrated> {
  // Atomic upsert so concurrent first-time reads can't race to create two rows.
  const doc = await Header.findOneAndUpdate(
    { key: HEADER_KEY },
    { $setOnInsert: { key: HEADER_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!doc) throw new Error("Failed to load the header");
  return doc;
}

async function toDTO(doc: HeaderHydrated): Promise<HeaderDTO> {
  const pageIds = doc.links
    .filter((l) => l.targetType === "page" && l.pageId)
    .map((l) => l.pageId as Types.ObjectId);
  const pages = pageIds.length
    ? await StaticPage.find({ _id: { $in: pageIds }, isDeleted: false }).select("title slug")
    : [];
  const byId = new Map(pages.map((p) => [p._id.toString(), p]));

  // Preserve the admin's chosen order; silently drop any link whose page no
  // longer resolves (deleted after the link was created).
  const links = doc.links
    .map((l): HeaderLinkDTO | null => {
      if (l.targetType === "route") {
        if (!l.routePath) return null;
        return {
          id: l._id.toString(),
          label: l.label,
          target: { type: "route", path: l.routePath },
          visibility: l.visibility,
          isActive: l.isActive,
        };
      }
      const page = l.pageId ? byId.get(l.pageId.toString()) : undefined;
      if (!page) return null;
      return {
        id: l._id.toString(),
        label: l.label,
        target: { type: "page", pageId: page._id.toString(), slug: page.slug, title: page.title },
        visibility: l.visibility,
        isActive: l.isActive,
      };
    })
    .filter((l): l is HeaderLinkDTO => l !== null);

  return { links, updatedAt: doc.updatedAt.toISOString() };
}

export async function getHeader(): Promise<HeaderDTO> {
  return toDTO(await loadOrCreate());
}

export async function updateHeader(body: UpdateHeaderBody): Promise<HeaderDTO> {
  const doc = await loadOrCreate();

  const pageIds = body.links.filter((l) => l.targetType === "page").map((l) => l.pageId as string);
  if (pageIds.length > 0) {
    const count = await StaticPage.countDocuments({
      _id: { $in: pageIds },
      isDeleted: false,
    });
    if (count !== new Set(pageIds).size) {
      throw new BadRequestError("One of the selected pages no longer exists");
    }
  }

  doc.set(
    "links",
    body.links.map((l) => ({
      label: l.label,
      targetType: l.targetType,
      routePath: l.targetType === "route" ? l.routePath : null,
      pageId: l.targetType === "page" ? new Types.ObjectId(l.pageId) : null,
      visibility: l.visibility,
      isActive: l.isActive,
    })),
  );
  await doc.save();
  return toDTO(doc);
}
