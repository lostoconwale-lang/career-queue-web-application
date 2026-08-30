"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Close } from "@/app/_components/Icons";
import { JobFilters, type JobFiltersState } from "@/app/_components/jobs/JobFilters";
import type { JobFilterOption } from "@/types/public-job";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: JobFilterOption[];
  jobTypes: JobFilterOption[];
  /** The filters currently applied to the listing (the URL state). */
  applied: JobFiltersState;
  onApply: (next: JobFiltersState) => void;
};

// A bottom-sheet filter panel for mobile — mirrors the filter drawer pattern
// from mobile shopping apps: changes are staged locally and only take effect
// when "Apply filters" is pressed; "Cancel" discards them.
export function MobileFilterDrawer({
  open,
  onClose,
  categories,
  jobTypes,
  applied,
  onApply,
}: Props) {
  const [draft, setDraft] = useState<JobFiltersState>(applied);

  // Re-sync the draft from the applied state every time the sheet transitions
  // to open, so a cancelled edit never leaks into the next time it's opened.
  // Adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(applied);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  function toggleCategory(id: string) {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  }

  function toggleJobType(id: string) {
    setDraft((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(id)
        ? prev.jobTypes.filter((t) => t !== id)
        : [...prev.jobTypes, id],
    }));
  }

  const draftCount = draft.categories.length + draft.jobTypes.length;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-ink/40 fixed inset-0 z-50 lg:hidden"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filter jobs"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="bg-surface shadow-lift fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl lg:hidden"
          >
            <div className="flex items-center justify-center pt-3">
              <span className="bg-line h-1 w-10 rounded-full" />
            </div>

            <div className="border-line flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-ink text-lg font-semibold">Filters</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-muted hover:text-ink"
              >
                <Close className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <JobFilters
                categories={categories}
                jobTypes={jobTypes}
                selected={draft}
                onToggleCategory={toggleCategory}
                onToggleJobType={toggleJobType}
                onClearAll={() => setDraft({ categories: [], jobTypes: [] })}
              />
            </div>

            <div className="border-line flex items-center gap-3 border-t px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="border-line text-ink hover:bg-cream flex-1 rounded-full border px-5 py-3 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  onClose();
                }}
                className="bg-brand text-surface shadow-soft flex-1 rounded-full px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              >
                Apply filters{draftCount > 0 ? ` (${draftCount})` : ""}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
