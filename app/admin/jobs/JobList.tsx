"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { Buildings, Close, Photo } from "@/app/_components/Icons";
import { SearchInput } from "@/app/_components/SearchInput";
import { Select } from "@/app/_components/Select";
import { Table, type Column } from "@/app/_components/Table";
import { ActionButton, Pager, Switch } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/date";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { CategoryDTO } from "@/types/category";
import type { JobTypeDTO } from "@/types/job-type";
import type { JobDTO } from "@/types/job";

type Status = "all" | "active" | "inactive";

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function JobList() {
  const router = useRouter();
  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState<{
    q: string;
    status: Status;
    categoryId: string;
    jobTypeId: string;
  }>({ q: "", status: "all", categoryId: "", jobTypeId: "" });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeDTO[]>([]);
  const [data, setData] = useState<CursorPage<JobDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [deleting, setDeleting] = useState<JobDTO | null>(null);

  function applyQuery(patch: Partial<typeof query>) {
    setQuery((prev) => ({ ...prev, ...patch }));
    setCursors([null]);
  }

  const filtersActive =
    query.status !== "all" ||
    query.categoryId !== "" ||
    query.jobTypeId !== "" ||
    qInput.trim() !== "";

  function clearFilters() {
    setQInput("");
    setQuery({ q: "", status: "all", categoryId: "", jobTypeId: "" });
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
    if (query.status === "active") params.set("isActive", "true");
    if (query.status === "inactive") params.set("isActive", "false");
    if (query.categoryId) params.set("categoryId", query.categoryId);
    if (query.jobTypeId) params.set("jobTypeId", query.jobTypeId);

    fetch(`/api/v1/jobs?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<JobDTO>>>;
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
        if (alive) setError("Could not load jobs.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cursors, query, reloadKey]);

  function goNext() {
    const next = data?.nextCursor;
    if (data?.hasMore && next) setCursors((c) => [...c, next]);
  }
  function goPrev() {
    setCursors((c) => (c.length > 1 ? c.slice(0, -1) : c));
  }

  async function toggleActive(job: JobDTO) {
    setBusyId(job.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !job.isActive }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<JobDTO>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not update that job. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/jobs/${deleting.id}`, { method: "DELETE" });
      if (redirectOnDenied(res)) return;
      if (!res.ok) {
        const json = (await res.json()) as ApiResponse<unknown>;
        setError(json.success ? "Could not delete that job." : json.error.message);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not delete that job. Please try again.");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  }

  const columns: Column<JobDTO>[] = [
    {
      key: "thumb",
      header: "",
      className: "w-14",
      cell: (j) =>
        j.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={j.thumbnail.url}
            alt=""
            className="border-line bg-cream h-9 w-9 rounded-lg border object-cover"
          />
        ) : (
          <span className="border-line bg-cream text-muted/50 grid h-9 w-9 place-items-center rounded-lg border">
            <Photo className="h-4 w-4" />
          </span>
        ),
    },
    {
      key: "title",
      header: "Job",
      cell: (j) => (
        <div className="min-w-0">
          <p className="text-ink font-semibold">{j.title}</p>
          <p className="text-muted mt-0.5 truncate text-xs">
            {j.categories.length ? j.categories.map((c) => c.name).join(", ") : "No categories"}
          </p>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      cell: (j) =>
        j.company ? (
          <div className="flex min-w-0 items-center gap-2">
            {j.company.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={j.company.logo.url}
                alt=""
                className="border-line bg-cream h-7 w-7 shrink-0 rounded-md border object-contain p-0.5"
              />
            ) : (
              <span className="border-line bg-cream text-muted/50 grid h-7 w-7 shrink-0 place-items-center rounded-md border">
                <Buildings className="h-3.5 w-3.5" />
              </span>
            )}
            <span className="text-ink truncate text-sm">{j.company.name}</span>
          </div>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      key: "jobTypes",
      header: "Type",
      cell: (j) => (
        <span className="text-muted text-xs">
          {j.jobTypes.length ? j.jobTypes.map((t) => t.name).join(", ") : "—"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Active",
      cell: (j) => (
        <div className="flex items-center gap-2.5">
          <Switch
            checked={j.isActive}
            disabled={busyId === j.id}
            onChange={() => toggleActive(j)}
            label={`Toggle ${j.title}`}
          />
          <span className="text-muted text-xs">{j.isActive ? "Active" : "Inactive"}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (j) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(j.createdAt)}>
          {formatDate(j.createdAt)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (j) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(j.updatedAt)}>
          {formatRelativeTime(j.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (j) => (
        <div className="flex justify-end gap-2">
          <ActionButton
            disabled={busyId === j.id}
            onClick={() => router.push(`/admin/jobs/${j.id}/edit`)}
          >
            Edit
          </ActionButton>
          <ActionButton tone="danger" disabled={busyId === j.id} onClick={() => setDeleting(j)}>
            Delete
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
            Jobs
          </h1>
          <p className="text-muted mt-2 text-sm">
            The job listings shown across the job board. Turn one off to hide it without deleting.
          </p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="bg-brand text-surface shadow-soft shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          New job
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Select
          value={query.status}
          onChange={(status) => applyQuery({ status: status as Status })}
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
          placeholder="Search jobs…"
          ariaLabel="Search jobs by title or category"
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
          rowKey={(j) => j.id}
          loading={loading}
          emptyMessage="No jobs match this view."
          minWidth={980}
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

      <ConfirmDialog
        open={deleting !== null}
        busy={deleting ? busyId === deleting.id : false}
        tone="danger"
        title="Delete this job?"
        description={deleting ? `"${deleting.title}" will be removed from the job board.` : null}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
