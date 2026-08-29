import { AdminProfile } from "./AdminProfile";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data from GET /api/v1/admin/me.
export default function AdminProfilePage() {
  return <AdminProfile />;
}
