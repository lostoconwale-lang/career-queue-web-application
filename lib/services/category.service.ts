import "server-only";
import { Types } from "mongoose";

import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { mediaUrl } from "@/lib/media";
import { Category, type CategoryHydrated } from "@/lib/models/category.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import type {
  CreateCategoryBody,
  ListCategoriesQuery,
  UpdateCategoryBody,
} from "@/lib/validators/category.validator";
import type { CursorPage } from "@/types/api";
import type { CategoryDTO } from "@/types/category";

export function toCategoryDTO(c: CategoryHydrated): CategoryDTO {
  return {
    id: c._id.toString(),
    name: c.name,
    description: c.description,
    icon: c.icon
      ? {
          id: c.icon._id.toString(),
          key: c.icon.key,
          url: mediaUrl(c.icon.key),
        }
      : null,
    seo: {
      metaTitle: c.seo.metaTitle,
      metaDescription: c.seo.metaDescription,
      metaKeywords: [...c.seo.metaKeywords],
      ogImage: c.seo.ogImage,
    },
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function getCategoryById(id: string): Promise<CategoryDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Category");
  const doc = await Category.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Category");
  return toCategoryDTO(doc);
}

export async function listCategories(
  query: ListCategoriesQuery,
): Promise<CursorPage<CategoryDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await Category.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toCategoryDTO), query.limit);
}

export async function createCategory(body: CreateCategoryBody): Promise<CategoryDTO> {
  if (await Category.exists({ name: body.name, isDeleted: false })) {
    throw new ConflictError("A category with this name already exists");
  }
  const doc = await Category.create({
    name: body.name,
    description: body.description,
    icon: body.icon ?? null,
    seo: body.seo,
  });
  return toCategoryDTO(doc);
}

export async function updateCategory(
  id: string,
  patch: UpdateCategoryBody,
): Promise<CategoryDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Category");
  const doc = await Category.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Category");

  if (patch.name !== undefined && patch.name !== doc.name) {
    if (await Category.exists({ name: patch.name, isDeleted: false, _id: { $ne: doc._id } })) {
      throw new ConflictError("A category with this name already exists");
    }
    doc.name = patch.name;
  }
  if (patch.description !== undefined) doc.description = patch.description;
  if (patch.icon !== undefined) doc.set("icon", patch.icon);
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;
  if (patch.seo !== undefined) doc.seo = patch.seo;

  await doc.save();
  return toCategoryDTO(doc);
}

export async function deleteCategory(id: string): Promise<CategoryDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Category");
  const doc = await Category.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("Category");

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();
  return toCategoryDTO(doc);
}
