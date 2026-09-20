import { Suspense } from "react";
import type { Metadata } from "next";

import Footer from "@/app/_components/Footer";
import Nav from "@/app/_components/Nav";
import { JobListingPage } from "@/app/jobs/JobListingPage";
import { listPublicSettings } from "@/lib/services/public-settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse open roles — CareerQueue",
  description: "Search and filter every open position on CareerQueue.",
};

// Auth is enforced by middleware.ts. Data is fetched client-side from the
// public search/filter API (/api/v1/public/jobs, /api/v1/public/job-filters)
// inside JobListingPage.
export default async function JobsPage() {
  const { siteName, iconLightUrl } = await listPublicSettings();

  return (
    <>
      <Nav iconUrl={iconLightUrl} siteName={siteName} />
      <main>
        <Suspense fallback={null}>
          <JobListingPage />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
