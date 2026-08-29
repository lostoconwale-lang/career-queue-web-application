import { AdminUsers } from "./AdminUsers";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// GET/PUT /api/v1/users (admin-only).
export default function AdminUsersPage() {
  return <AdminUsers />;
}
