"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Filter } from "@/app/_components/Icons";
import { EmptyState } from "@/app/_components/jobs/EmptyState";
import { JobCard } from "@/app/_components/jobs/JobCard";
import { JobFilters, type JobFiltersState } from "@/app/_components/jobs/JobFilters";
import { JobPagination } from "@/app/_components/jobs/JobPagination";
import { JobSearchBar } from "@/app/_components/jobs/JobSearchBar";
import { MobileFilterDrawer } from "@/app/_components/jobs/MobileFilterDrawer";
import { ViewToggle, type JobView } from "@/app/_components/jobs/ViewToggle";
import { htmlToText } from "@/lib/sanitize-html";
import type { CategoryDTO } from "@/types/category";
import type { JobTypeDTO } from "@/types/job-type";
import type { JobDTO } from "@/types/job";

const PAGE_SIZE = 6;

type Props = {
  jobs: JobDTO[];
  categories: CategoryDTO[];
  jobTypes: JobTypeDTO[];
};

export function JobListingPage({ jobs, categories, jobTypes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const selectedCategories = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const selectedJobTypes = searchParams.get("types")?.split(",").filter(Boolean) ?? [];
  const view: JobView = searchParams.get("view") === "grid" ? "grid" : "list";
  const requestedPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [qInput, setQInput] = useState(q);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Reflects back into the search box if the URL changes from elsewhere (e.g.
  // the browser's back/forward buttons) — adjusted during render rather than
  // in an effect, per https://react.dev/learn/you-might-not-need-an-effect.
  const [qSyncedWith, setQSyncedWith] = useState(q);
  if (q !== qSyncedWith) {
    setQSyncedWith(q);
    setQInput(q);
  }

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    // Query params are appended dynamically, so typed routes can't narrow this
    // to a known literal — it's always a same-page navigation (`pathname`).
    router.push((qs ? `${pathname}?${qs}` : pathname) as Route, { scroll: false });
  }

  function setSearch(value: string) {
    pushParams((params) => {
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
    });
  }

  // Debounced: types update the URL 300ms after the user stops, same as the
  // admin listing pages.
  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed === q) return;
    const t = setTimeout(() => setSearch(trimmed), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  function toggleCategory(id: string) {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id];
    pushParams((params) => {
      if (next.length) params.set("categories", next.join(","));
      else params.delete("categories");
      params.delete("page");
    });
  }

  function toggleJobType(id: string) {
    const next = selectedJobTypes.includes(id)
      ? selectedJobTypes.filter((t) => t !== id)
      : [...selectedJobTypes, id];
    pushParams((params) => {
      if (next.length) params.set("types", next.join(","));
      else params.delete("types");
      params.delete("page");
    });
  }

  function applyFilters(next: JobFiltersState) {
    pushParams((params) => {
      if (next.categories.length) params.set("categories", next.categories.join(","));
      else params.delete("categories");
      if (next.jobTypes.length) params.set("types", next.jobTypes.join(","));
      else params.delete("types");
      params.delete("page");
    });
  }

  function clearFilters() {
    pushParams((params) => {
      params.delete("categories");
      params.delete("types");
      params.delete("page");
    });
  }

  function resetAll() {
    setQInput("");
    pushParams((params) => {
      params.delete("q");
      params.delete("categories");
      params.delete("types");
      params.delete("page");
    });
  }

  function setView(next: JobView) {
    pushParams((params) => {
      if (next === "grid") params.set("view", "grid");
      else params.delete("view");
    });
  }

  function setPage(next: number) {
    pushParams((params) => {
      if (next > 1) params.set("page", String(next));
      else params.delete("page");
    });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const job of jobs) for (const c of job.categories) counts[c.id] = (counts[c.id] ?? 0) + 1;
    return counts;
  }, [jobs]);

  const jobTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const job of jobs) for (const t of job.jobTypes) counts[t.id] = (counts[t.id] ?? 0) + 1;
    return counts;
  }, [jobs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return jobs
      .filter((job) => job.isActive)
      .filter((job) => {
        if (term) {
          const haystack = `${job.title} ${job.company?.name ?? ""} ${htmlToText(job.description)}`
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        if (
          selectedCategories.length &&
          !job.categories.some((c) => selectedCategories.includes(c.id))
        )
          return false;
        if (selectedJobTypes.length && !job.jobTypes.some((t) => selectedJobTypes.includes(t.id)))
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, q, searchParams]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasActiveFilters = selectedCategories.length > 0 || selectedJobTypes.length > 0 || q !== "";
  const activeFilterCount = selectedCategories.length + selectedJobTypes.length;

  const filtersState: JobFiltersState = { categories: selectedCategories, jobTypes: selectedJobTypes };

  return (
    <>
      <section className="border-line bg-surface border-b">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          
          <h1 className="font-display text-ink mt-3 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
            Find your next role
          </h1>
          <p className="text-muted mt-3 max-w-xl text-base leading-relaxed">
            Browse every open position and filter down to the ones worth your time.
          </p>
          <div className="mt-8 max-w-2xl">
            <JobSearchBar
              value={qInput}
              onChange={setQInput}
              onSubmit={() => setSearch(qInput.trim())}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <JobFilters
                categories={categories}
                jobTypes={jobTypes}
                categoryCounts={categoryCounts}
                jobTypeCounts={jobTypeCounts}
                selected={filtersState}
                onToggleCategory={toggleCategory}
                onToggleJobType={toggleJobType}
                onClearAll={clearFilters}
              />
            </div>
          </aside>

          <div ref={resultsRef} className="min-w-0 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted text-sm">
                <span className="text-ink font-semibold tabular-nums">{filtered.length}</span> open
                role{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="border-line bg-surface shadow-soft relative inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand/40 lg:hidden"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 ? (
                    <span className="bg-brand text-surface grid h-5 w-5 place-items-center rounded-full text-[11px] tabular-nums">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>

            {pageItems.length === 0 ? (
              <div className="mt-6">
                <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={resetAll} />
              </div>
            ) : (
              <>
                <div
                  className={
                    view === "grid"
                      ? "mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                      : "mt-6 flex flex-col gap-4"
                  }
                >
                  {pageItems.map((job) => (
                    <JobCard key={job.id} job={job} view={view} />
                  ))}
                </div>
                <JobPagination page={currentPage} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        jobTypes={jobTypes}
        categoryCounts={categoryCounts}
        jobTypeCounts={jobTypeCounts}
        applied={filtersState}
        onApply={applyFilters}
      />
    </>
  );
}
