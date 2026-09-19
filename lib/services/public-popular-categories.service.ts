import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import type { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { Category } from "@/lib/models/category.model";
import { Job } from "@/lib/models/job.model";
import { PopularCategories, POPULAR_CATEGORIES_KEY } from "@/lib/models/popular-categories.model";
import type { PublicPopularCategoryDTO } from "@/types/public-popular-categories";

// The categories an admin featured on the home page, in the order they
// picked, each with a live count of currently-active jobs. Rendered on every
// visit but only changes when an admin edits the selection, so the query is
// wrapped in Next's data cache — `revalidatePublicPopularCategories()` clears
// it on any write.
async function queryPublicPopularCategories(): Promise<PublicPopularCategoryDTO[]> {
  await connectToDatabase();

  const doc = await PopularCategories.findOne({ key: POPULAR_CATEGORIES_KEY });
  const categoryIds = doc?.categoryIds ?? [];
  if (categoryIds.length === 0) return [];

  const categories = await Category.find({
    _id: { $in: categoryIds },
    isActive: true,
    isDeleted: false,
  }).select("name");
  if (categories.length === 0) return [];

  const nameById = new Map(categories.map((c) => [c._id.toString(), c.name]));

  const counts = await Job.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { isActive: true, isDeleted: false } },
    { $unwind: "$categories" },
    { $match: { "categories._id": { $in: categories.map((c) => c._id) } } },
    { $group: { _id: "$categories._id", count: { $sum: 1 } } },
  ]);
  const countById = new Map(counts.map((c) => [c._id.toString(), c.count]));

  // Preserve the admin's chosen order; skip any id that's since been
  // deactivated or deleted.
  return categoryIds
    .map((id) => {
      const key = id.toString();
      const name = nameById.get(key);
      return name ? { id: key, name, openRoles: countById.get(key) ?? 0 } : null;
    })
    .filter((c): c is PublicPopularCategoryDTO => c !== null);
}

export const listPublicPopularCategories = unstable_cache(
  queryPublicPopularCategories,
  ["public-popular-categories"],
  {
    tags: [CACHE_TAGS.publicPopularCategories],
    // Fallback so open-role counts don't drift too far from reality even
    // without an explicit revalidate (job writes don't trigger one).
    revalidate: 3600,
  },
);

export function revalidatePublicPopularCategories(): void {
  revalidateTag(CACHE_TAGS.publicPopularCategories, "max");
}
