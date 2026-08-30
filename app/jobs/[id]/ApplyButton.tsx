"use client";

import { useState } from "react";

import { ApplyModal } from "@/app/_components/jobs/ApplyModal";
import type { JobDTO } from "@/types/job";

export function ApplyButton({ job }: { job: JobDTO }) {
  const [applying, setApplying] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setApplying(true)}
        className="bg-brand text-surface shadow-soft mt-5 rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
      >
        Apply now
      </button>
      <ApplyModal job={job} open={applying} onClose={() => setApplying(false)} />
    </>
  );
}
