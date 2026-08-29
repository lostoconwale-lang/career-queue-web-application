import { CategoryList } from "./CategoryList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/categories and /api/v1/categories/:id (admin-only).
export default function CategoriesPage() {
  return <CategoryList />;
}
