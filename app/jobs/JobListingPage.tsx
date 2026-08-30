"use client";

import { useEffect, useRef, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Filter } from "@/app/_components/Icons";
import { EmptyState } from "@/app/_components/jobs/EmptyState";
import { JobCard } from "@/app/_components/jobs/JobCard";
import { JobCardSkeleton } from "@/app/_components/jobs/JobCardSkeleton";
import { JobFilters, type JobFiltersState } from "@/app/_components/jobs/JobFilters";
import { JobPagination } from "@/app/_components/jobs/JobPagination";
import { JobSearchBar } from "@/app/_components/jobs/JobSearchBar";
import { MobileFilterDrawer } from "@/app/_components/jobs/MobileFilterDrawer";
import { ViewToggle, type JobView } from "@/app/_components/jobs/ViewToggle";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { JobFilterOptionsDTO, PublicJobListDTO } from "@/types/public-job";

const PAGE_SIZE = 6;
const EMPTY_FILTER_OPTIONS: JobFilterOptionsDTO = { categories: [], jobTypes: [] };

export function JobListingPage() {
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

  const [filterOptions, setFilterOptions] = useState<JobFilterOptionsDTO>(EMPTY_FILTER_OPTIONS);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  const [listing, setListing] = useState<PublicJobListDTO | null>(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

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

  // Search only runs when the search bar is submitted (button click or
  // Enter) — typing alone doesn't touch the URL or trigger a fetch.

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

  // Filter options (with live job counts) rarely change — fetched once.
  useEffect(() => {
    let alive = true;
    fetch("/api/v1/public/job-filters", { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<JobFilterOptionsDTO>>;
      })
      .then((json) => {
        if (!alive || !json) return;
        if (json.success) setFilterOptions(json.data);
        else setFiltersError(json.error.message);
      })
      .catch(() => {
        if (alive) setFiltersError("Could not load filters.");
      });
    return () => {
      alive = false;
    };
  }, []);

  // The job results — refetched from the search + filter API whenever the
  // URL-driven query state changes.
  useEffect(() => {
    let alive = true;
    // Only the initial load shows the skeleton (jobsLoading starts `true`);
    // later refetches swap results in place without one, matching the admin
    // list pages' loading-indicator convention.
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(requestedPage) });
    if (q) params.set("q", q);
    if (selectedCategories.length) params.set("categories", selectedCategories.join(","));
    if (selectedJobTypes.length) params.set("types", selectedJobTypes.join(","));

    fetch(`/api/v1/public/jobs?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<PublicJobListDTO>>;
      })
      .then((json) => {
        if (!alive || !json) return;
        if (json.success) {
          setListing(json.data);
          setJobsError(null);
        } else {
          setJobsError(json.error.message);
        }
      })
      .catch(() => {
        if (alive) setJobsError("Could not load jobs. Please try again.");
      })
      .finally(() => {
        if (alive) setJobsLoading(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selectedCategories.join(","), selectedJobTypes.join(","), requestedPage]);

  const items = listing?.items ?? [];
  const total = listing?.total ?? 0;
  const totalPages = listing?.totalPages ?? 1;
  const currentPage = listing?.page ?? requestedPage;

  const hasActiveFilters = selectedCategories.length > 0 || selectedJobTypes.length > 0 || q !== "";
  const activeFilterCount = selectedCategories.length + selectedJobTypes.length;

  const filtersState: JobFiltersState = { categories: selectedCategories, jobTypes: selectedJobTypes };

  return (
    <>
      <section className="border-line bg-surface border-b">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">
            Job listings
          </p>
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
              onClear={() => {
                setQInput("");
                setSearch("");
              }}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              {filtersError ? (
                <p className="border-coral/30 bg-coral/10 text-coral rounded-2xl border px-4 py-3 text-sm">
                  {filtersError}
                </p>
              ) : (
                <JobFilters
                  categories={filterOptions.categories}
                  jobTypes={filterOptions.jobTypes}
                  selected={filtersState}
                  onToggleCategory={toggleCategory}
                  onToggleJobType={toggleJobType}
                  onClearAll={clearFilters}
                />
              )}
            </div>
          </aside>

          <div ref={resultsRef} className="min-w-0 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted text-sm">
                <span className="text-ink font-semibold tabular-nums">{total}</span> open role
                {total === 1 ? "" : "s"}
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

            {jobsError ? (
              <p className="border-coral/30 bg-coral/10 text-coral mt-6 rounded-2xl border px-4 py-3 text-sm">
                {jobsError}
              </p>
            ) : jobsLoading ? (
              <div
                className={
                  view === "grid"
                    ? "mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    : "mt-6 flex flex-col gap-4"
                }
              >
                {Array.from({ length: PAGE_SIZE }, (_, i) => (
                  <JobCardSkeleton key={i} view={view} />
                ))}
              </div>
            ) : items.length === 0 ? (
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
                  {items.map((job) => (
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
        categories={filterOptions.categories}
        jobTypes={filterOptions.jobTypes}
        applied={filtersState}
        onApply={applyFilters}
      />
    </>
  );
}
