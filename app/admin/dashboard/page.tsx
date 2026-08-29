import { auth } from "@/lib/auth/nextauth";
import { AdminDashboard } from "./AdminDashboard";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx; the data comes from
// GET /api/v1/admin/overview, which re-checks admin auth on its own.
export default async function AdminDashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? "Admin").split(" ")[0] || "Admin";

  return <AdminDashboard adminName={firstName} />;
}
