import { PopularCategoriesForm } from "./PopularCategoriesForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/popular-categories (admin-only).
export default function PopularCategoriesPage() {
  return <PopularCategoriesForm />;
}
