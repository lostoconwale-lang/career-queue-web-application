import "server-only";
import { Types } from "mongoose";

import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { normalizeSearchText } from "@/lib/models/searchable";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { StaticPage, type StaticPageHydrated } from "@/lib/models/static-pages.model";
import type {
  CreateStaticPageBody,
  ListStaticPagesQuery,
  UpdateStaticPageBody,
} from "@/lib/validators/static-pages.validator";
import type { CursorPage } from "@/types/api";
import type { StaticPageDTO } from "@/types/static-page";

export function toStaticPageDTO(p: StaticPageHydrated): StaticPageDTO {
  return {
    id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    content: p.content,
    seo: {
      metaTitle: p.seo.metaTitle,
      metaDescription: p.seo.metaDescription,
      metaKeywords: [...p.seo.metaKeywords],
      ogImage: p.seo.ogImage,
    },
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getStaticPageById(id: string): Promise<StaticPageDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Page");
  const doc = await StaticPage.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Page");
  return toStaticPageDTO(doc);
}

export async function listStaticPages(
  query: ListStaticPagesQuery,
): Promise<CursorPage<StaticPageDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await StaticPage.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toStaticPageDTO), query.limit);
}

async function assertSlugFree(slug: string, exceptId?: Types.ObjectId): Promise<void> {
  const clash = await StaticPage.exists({
    slug,
    isDeleted: false,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
  if (clash) throw new ConflictError("A page with this slug already exists");
}

export async function createStaticPage(body: CreateStaticPageBody): Promise<StaticPageDTO> {
  await assertSlugFree(body.slug);
  const doc = await StaticPage.create({
    title: body.title,
    slug: body.slug,
    content: sanitizeHtml(body.content),
    seo: body.seo,
  });
  return toStaticPageDTO(doc);
}

export async function updateStaticPage(
  id: string,
  patch: UpdateStaticPageBody,
): Promise<StaticPageDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Page");
  const doc = await StaticPage.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Page");

  if (patch.title !== undefined) doc.title = patch.title;
  if (patch.slug !== undefined && patch.slug !== doc.slug) {
    await assertSlugFree(patch.slug, doc._id);
    doc.slug = patch.slug;
  }
  if (patch.content !== undefined) doc.content = sanitizeHtml(patch.content);
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;
  if (patch.seo !== undefined) doc.seo = patch.seo;

  await doc.save();
  return toStaticPageDTO(doc);
}

export async function deleteStaticPage(id: string): Promise<StaticPageDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Page");
  const doc = await StaticPage.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Page");

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();
  return toStaticPageDTO(doc);
}
