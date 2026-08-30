import { Suspense } from "react";
import type { Metadata } from "next";

import Footer from "@/app/_components/Footer";
import Nav from "@/app/_components/Nav";
import { CATEGORIES, JOB_TYPES, JOBS } from "@/app/jobs/_data";
import { JobListingPage } from "@/app/jobs/JobListingPage";

export const metadata: Metadata = {
  title: "Browse open roles — CareerQueue",
  description: "Search and filter every open position on CareerQueue.",
};

// UI-only for now: jobs/categories/job-types come from local placeholder data
// shaped exactly like the real DTOs. Swapping in a real (public, isActive-only)
// listing endpoint later only touches this one file.
export default function JobsPage() {
  return (
    <>
      <Nav />
      <main>
        <Suspense fallback={null}>
          <JobListingPage jobs={JOBS} categories={CATEGORIES} jobTypes={JOB_TYPES} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
