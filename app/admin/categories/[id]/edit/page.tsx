import { CategoryForm } from "../../CategoryForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Loads via GET /api/v1/categories/:id,
// submits PUT to the same.
export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryForm categoryId={id} />;
}
