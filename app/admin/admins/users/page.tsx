import { AdminList } from "./AdminList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// GET /api/v1/admin and PUT /api/v1/admin/:id (admin-only).
export default function AdminUsersPage() {
  return <AdminList />;
}
