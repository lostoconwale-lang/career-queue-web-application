"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Close } from "@/app/_components/Icons";
import { SearchInput } from "@/app/_components/SearchInput";
import { Select } from "@/app/_components/Select";
import { Table, type Column } from "@/app/_components/Table";
import { ActionButton, Pager } from "@/app/admin/_components/table-ui";
import { StatusBadge } from "@/app/admin/applications/StatusBadge";
import { STATUS_LABEL } from "@/app/admin/applications/status-styles";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import { JOB_APPLICATION_STATUSES, type JobApplicationStatus } from "@/types/job-application";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { CategoryDTO } from "@/types/category";
import type { JobTypeDTO } from "@/types/job-type";
import type { JobApplicationDTO } from "@/types/job-application";

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...JOB_APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

export function ApplicationList() {
  const router = useRouter();
  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState<{
    q: string;
    status: JobApplicationStatus | "";
    categoryId: string;
    jobTypeId: string;
  }>({ q: "", status: "", categoryId: "", jobTypeId: "" });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeDTO[]>([]);
  const [data, setData] = useState<CursorPage<JobApplicationDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function applyQuery(patch: Partial<typeof query>) {
    setQuery((prev) => ({ ...prev, ...patch }));
    setCursors([null]);
  }

  const filtersActive =
    query.status !== "" ||
    query.categoryId !== "" ||
    query.jobTypeId !== "" ||
    qInput.trim() !== "";

  function clearFilters() {
    setQInput("");
    setQuery({ q: "", status: "", categoryId: "", jobTypeId: "" });
    setCursors([null]);
  }

  useEffect(() => {
    fetch("/api/v1/categories?isActive=true&limit=100", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res)
          ? null
          : (res.json() as Promise<ApiResponse<CursorPage<CategoryDTO>>>),
      )
      .then((json) => {
        if (json?.success) setCategories(json.data.items);
      })
      .catch(() => {});

    fetch("/api/v1/job-types?isActive=true&limit=100", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<CursorPage<JobTypeDTO>>>),
      )
      .then((json) => {
        if (json?.success) setJobTypes(json.data.items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const next = qInput.trim();
    if (next === query.q) return;
    const t = setTimeout(() => {
      setQuery((prev) => ({ ...prev, q: next }));
      setCursors([null]);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput, query.q]);

  useEffect(() => {
    let alive = true;
    const cursor = cursors[cursors.length - 1];
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    if (query.q) params.set("q", query.q);
    if (query.status) params.set("status", query.status);
    if (query.categoryId) params.set("categoryId", query.categoryId);
    if (query.jobTypeId) params.set("jobTypeId", query.jobTypeId);

    fetch(`/api/v1/applications?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<JobApplicationDTO>>>;
      })
      .then((json) => {
        if (!alive || !json) return;
        if (json.success) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.error.message);
        }
      })
      .catch(() => {
        if (alive) setError("Could not load applications.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cursors, query]);

  function goNext() {
    const next = data?.nextCursor;
    if (data?.hasMore && next) setCursors((c) => [...c, next]);
  }
  function goPrev() {
    setCursors((c) => (c.length > 1 ? c.slice(0, -1) : c));
  }

  const columns: Column<JobApplicationDTO>[] = [
    {
      key: "applicant",
      header: "Applicant",
      cell: (a) => (
        <div className="min-w-0">
          <p className="text-ink font-semibold">{a.applicant.name}</p>
          <p className="text-muted mt-0.5 truncate text-xs">{a.applicant.email}</p>
        </div>
      ),
    },
    {
      key: "job",
      header: "Job",
      cell: (a) => (
        <div className="min-w-0">
          <p className="text-ink font-semibold">{a.job.title}</p>
          <p className="text-muted mt-0.5 truncate text-xs">
            {a.job.company?.name ?? "No company"}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category / Type",
      cell: (a) => (
        <span className="text-muted text-xs">
          {[
            a.job.categories.map((c) => c.name).join(", "),
            a.job.jobTypes.map((t) => t.name).join(", "),
          ]
            .filter(Boolean)
            .join(" · ") || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: "createdAt",
      header: "Applied",
      cell: (a) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(a.createdAt)}>
          {formatRelativeTime(a.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (a) => (
        <div className="flex justify-end">
          <ActionButton onClick={() => router.push(`/admin/applications/${a.id}`)}>
            View
          </ActionButton>
        </div>
      ),
    },
  ];

  const pageNum = cursors.length;
  const rangeStart = (pageNum - 1) * PAGE_SIZE + 1;
  const rowCount = data?.items.length ?? 0;
  const hasPrev = cursors.length > 1;
  const hasNext = Boolean(data?.hasMore);
  const showPager = hasPrev || hasNext || rowCount > 0;

  return (
    <div className="px-5 py-10 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            Applications
          </h1>
          <p className="text-muted mt-2 text-sm">
            Everyone who&apos;s applied to a job, newest first.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Select
          value={query.status}
          onChange={(status) => applyQuery({ status: status as JobApplicationStatus | "" })}
          options={STATUS_OPTIONS}
          ariaLabel="Filter by status"
          className="w-full sm:w-44"
        />
        <Select
          value={query.categoryId}
          onChange={(categoryId) => applyQuery({ categoryId })}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          ariaLabel="Filter by category"
          className="w-full sm:w-56"
        />
        <Select
          value={query.jobTypeId}
          onChange={(jobTypeId) => applyQuery({ jobTypeId })}
          options={[
            { value: "", label: "All job types" },
            ...jobTypes.map((t) => ({ value: t.id, label: t.name })),
          ]}
          ariaLabel="Filter by job type"
          className="w-full sm:w-48"
        />
        {filtersActive ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-muted hover:border-brand/40 hover:text-ink border-line inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors"
          >
            <Close className="h-3.5 w-3.5" />
            Clear filters
          </button>
        ) : null}
        <SearchInput
          value={qInput}
          onChange={setQInput}
          placeholder="Search applicants or jobs…"
          ariaLabel="Search applications"
          className="ml-auto w-full sm:w-72"
        />
      </div>

      {error ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(a) => a.id}
          loading={loading}
          emptyMessage="No applications match this view."
          minWidth={900}
        />
      </div>

      {showPager ? (
        <Pager
          page={pageNum}
          rangeStart={rangeStart}
          rowCount={rowCount}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={goPrev}
          onNext={goNext}
        />
      ) : null}
    </div>
  );
}
