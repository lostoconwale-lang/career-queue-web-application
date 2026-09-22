import type { Metadata } from "next";
import { redirect } from "next/navigation";

import Footer from "@/app/_components/Footer";
import Nav from "@/app/_components/Nav";
import { Profile } from "@/app/profile/Profile";
import { auth } from "@/lib/auth/nextauth";
import { listPublicHeader } from "@/lib/services/public-header.service";
import { listPublicSettings } from "@/lib/services/public-settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your profile — CareerQueue",
};

// proxy.ts already redirects unauthenticated visitors to /login; this second
// check also keeps admins (a separate account kind, with their own
// /admin/profile) off this page.
export default async function ProfilePage() {
  const [{ siteName, iconLightUrl }, headerLinks, session] = await Promise.all([
    listPublicSettings(),
    listPublicHeader(),
    auth(),
  ]);

  if (session?.user?.kind !== "user") redirect("/login");

  return (
    <>
      <Nav iconUrl={iconLightUrl} siteName={siteName} links={headerLinks} isAuthenticated />
      <main>
        <Profile />
      </main>
      <Footer />
    </>
  );
}
