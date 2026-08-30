import { CompanyForm } from "../CompanyForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Submits POST /api/v1/companies.
export default function NewCompanyPage() {
  return <CompanyForm />;
}
