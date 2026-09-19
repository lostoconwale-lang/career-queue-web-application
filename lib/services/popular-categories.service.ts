import "server-only";
import { Types } from "mongoose";

import { BadRequestError } from "@/lib/api/errors";
import { Category } from "@/lib/models/category.model";
import {
  PopularCategories,
  POPULAR_CATEGORIES_KEY,
  type PopularCategoriesHydrated,
} from "@/lib/models/popular-categories.model";
import type { UpdatePopularCategoriesBody } from "@/lib/validators/popular-categories.validator";
import type { PopularCategoriesDTO } from "@/types/popular-categories";

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
  if (doc.categoryIds.length === 0) return { categories: [], updatedAt: doc.updatedAt.toISOString() };

  const categories = await Category.find({ _id: { $in: doc.categoryIds }, isDeleted: false }).select(
    "name",
  );
  const nameById = new Map(categories.map((c) => [c._id.toString(), c.name]));

  // Preserve the admin's chosen order; silently drop any id that no longer resolves.
  const resolved = doc.categoryIds
    .map((id) => {
      const name = nameById.get(id.toString());
      return name ? { id: id.toString(), name } : null;
    })
    .filter((c): c is { id: string; name: string } => c !== null);

  return { categories: resolved, updatedAt: doc.updatedAt.toISOString() };
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

  doc.categoryIds = body.categoryIds.map((id) => new Types.ObjectId(id));
  await doc.save();
  return toDTO(doc);
}
