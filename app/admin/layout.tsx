import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/nextauth";
import { AdminShell } from "./_components/AdminShell";

export const runtime = "nodejs";

// One guard for the whole /admin panel. Individual APIs re-check on their own.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  // Signed in, but not as an admin (or admin access was revoked mid-session).
  if (session.user.kind !== "admin") redirect("/no-access?code=403");

  return <AdminShell name={session.user.name ?? "Admin"}>{children}</AdminShell>;
}
