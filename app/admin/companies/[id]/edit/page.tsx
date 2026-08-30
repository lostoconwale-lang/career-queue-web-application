import { CompanyForm } from "../../CompanyForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Loads via GET /api/v1/companies/:id,
// submits PUT to the same.
export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompanyForm companyId={id} />;
}
