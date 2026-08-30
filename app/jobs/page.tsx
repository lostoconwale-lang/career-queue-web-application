import { Suspense } from "react";
import type { Metadata } from "next";

import Footer from "@/app/_components/Footer";
import Nav from "@/app/_components/Nav";
import { JobListingPage } from "@/app/jobs/JobListingPage";

export const metadata: Metadata = {
  title: "Browse open roles — CareerQueue",
  description: "Search and filter every open position on CareerQueue.",
};

// Data is fetched client-side from the public search/filter API
// (/api/v1/public/jobs, /api/v1/public/job-filters) inside JobListingPage.
export default function JobsPage() {
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
