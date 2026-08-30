import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import Footer from "@/app/_components/Footer";
import Nav from "@/app/_components/Nav";
import { JobListingPage } from "@/app/jobs/JobListingPage";
import { auth } from "@/lib/auth/nextauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse open roles — CareerQueue",
  description: "Search and filter every open position on CareerQueue.",
};

// Data is fetched client-side from the public search/filter API
// (/api/v1/public/jobs, /api/v1/public/job-filters) inside JobListingPage.
export default async function JobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <Nav />
      <main>
        <Suspense fallback={null}>
          <JobListingPage />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
