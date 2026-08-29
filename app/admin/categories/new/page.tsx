import { CategoryForm } from "../CategoryForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Submits POST /api/v1/categories.
export default function NewCategoryPage() {
  return <CategoryForm />;
}
