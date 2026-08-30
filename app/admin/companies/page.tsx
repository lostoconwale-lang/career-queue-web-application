import { CompanyList } from "./CompanyList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/companies and /api/v1/companies/:id (admin-only).
export default function CompaniesPage() {
  return <CompanyList />;
}
