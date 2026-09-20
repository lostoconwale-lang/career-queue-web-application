import { HeaderForm } from "./HeaderForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/header (admin-only).
export default function HeaderPage() {
  return <HeaderForm />;
}
