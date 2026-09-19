import "server-only";
import { Types } from "mongoose";

import { BadRequestError } from "@/lib/api/errors";
import { mediaUrl } from "@/lib/media";
import { Category } from "@/lib/models/category.model";
import {
  PopularCategories,
  POPULAR_CATEGORIES_KEY,
  type PopularCategoriesHydrated,
} from "@/lib/models/popular-categories.model";
import type { UpdatePopularCategoriesBody } from "@/lib/validators/popular-categories.validator";
import type { PopularCategoriesDTO, PopularCategoryRef } from "@/types/popular-categories";

// Load the singleton, creating it on first access.
async function loadOrCreate(): Promise<PopularCategoriesHydrated> {
  // Atomic upsert so concurrent first-time reads can't race to create two rows.
  const doc = await PopularCategories.findOneAndUpdate(
    { key: POPULAR_CATEGORIES_KEY },
    { $setOnInsert: { key: POPULAR_CATEGORIES_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!doc) throw new Error("Failed to load popular categories");
  return doc;
}

async function toDTO(doc: PopularCategoriesHydrated): Promise<PopularCategoriesDTO> {
  if (doc.categoryIds.length === 0) {
    return { headline: doc.headline, categories: [], updatedAt: doc.updatedAt.toISOString() };
  }

  const categories = await Category.find({
    _id: { $in: doc.categoryIds },
    isDeleted: false,
  }).select("name icon");
  const byId = new Map(categories.map((c) => [c._id.toString(), c]));

  // Preserve the admin's chosen order; silently drop any id that no longer resolves.
  const resolved = doc.categoryIds
    .map((id) => {
      const c = byId.get(id.toString());
      if (!c) return null;
      return {
        id: id.toString(),
        name: c.name,
        icon: c.icon ? { id: c.icon._id.toString(), key: c.icon.key, url: mediaUrl(c.icon.key) } : null,
      };
    })
    .filter((c): c is PopularCategoryRef => c !== null);

  return { headline: doc.headline, categories: resolved, updatedAt: doc.updatedAt.toISOString() };
}

export async function getPopularCategories(): Promise<PopularCategoriesDTO> {
  return toDTO(await loadOrCreate());
}

export async function updatePopularCategories(
  body: UpdatePopularCategoriesBody,
): Promise<PopularCategoriesDTO> {
  const doc = await loadOrCreate();

  if (body.categoryIds.length > 0) {
    const count = await Category.countDocuments({
      _id: { $in: body.categoryIds },
      isDeleted: false,
    });
    if (count !== body.categoryIds.length) {
      throw new BadRequestError("One of the selected categories no longer exists");
    }
  }

  doc.headline = body.headline;
  doc.categoryIds = body.categoryIds.map((id) => new Types.ObjectId(id));
  await doc.save();
  return toDTO(doc);
}
