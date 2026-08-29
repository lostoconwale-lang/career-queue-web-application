"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { SearchInput } from "@/app/_components/SearchInput";
import { Select } from "@/app/_components/Select";
import { Table, type Column } from "@/app/_components/Table";
import { ActionButton, Pager, Switch } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDate, formatDateTime } from "@/lib/date";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { JobTypeDTO } from "@/types/job-type";

type Status = "all" | "active" | "inactive";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function JobTypeList() {
  const router = useRouter();
  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState<{ q: string; status: Status }>({ q: "", status: "all" });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [data, setData] = useState<CursorPage<JobTypeDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [deleting, setDeleting] = useState<JobTypeDTO | null>(null);

  const filtersActive = query.status !== "all" || qInput.trim() !== "";

  function clearFilters() {
    setQInput("");
    setQuery({ q: "", status: "all" });
    setCursors([null]);
  }

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

    fetch(`/api/v1/job-types?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<JobTypeDTO>>>;
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
        if (alive) setError("Could not load job types.");
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

  async function toggleActive(jobType: JobTypeDTO) {
    setBusyId(jobType.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/job-types/${jobType.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !jobType.isActive }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<JobTypeDTO>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not update that job type. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/job-types/${deleting.id}`, { method: "DELETE" });
      if (redirectOnDenied(res)) return;
      if (!res.ok) {
        const json = (await res.json()) as ApiResponse<unknown>;
        setError(json.success ? "Could not delete that job type." : json.error.message);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not delete that job type. Please try again.");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  }

  const columns: Column<JobTypeDTO>[] = [
    {
      key: "name",
      header: "Job type",
      cell: (t) => (
        <div className="min-w-0">
          <p className="text-ink font-semibold">{t.name}</p>
          {t.description ? (
            <p className="text-muted mt-0.5 line-clamp-1 max-w-md text-xs">{t.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Active",
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <Switch
            checked={t.isActive}
            disabled={busyId === t.id}
            onChange={() => toggleActive(t)}
            label={`Toggle ${t.name}`}
          />
          <span className="text-muted text-xs">{t.isActive ? "Active" : "Inactive"}</span>
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (t) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(t.updatedAt)}>
          {formatDate(t.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (t) => (
        <div className="flex justify-end gap-2">
          <ActionButton
            disabled={busyId === t.id}
            onClick={() => router.push(`/admin/job-types/${t.id}/edit`)}
          >
            Edit
          </ActionButton>
          <ActionButton tone="danger" disabled={busyId === t.id} onClick={() => setDeleting(t)}>
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
            Job types
          </h1>
          <p className="text-muted mt-2 text-sm">
            The employment types a job can be tagged with — full time, remote, contract, and so on.
          </p>
        </div>
        <Link
          href="/admin/job-types/new"
          className="bg-brand text-surface shadow-soft shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          New job type
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Select
          value={query.status}
          onChange={(status) => {
            setQuery((prev) => ({ ...prev, status: status as Status }));
            setCursors([null]);
          }}
          options={STATUS_OPTIONS}
          ariaLabel="Filter by status"
          className="w-full sm:w-44"
        />
        {filtersActive ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-muted hover:border-brand/40 hover:text-ink border-line inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors"
          >
            Clear filters
          </button>
        ) : null}
        <SearchInput
          value={qInput}
          onChange={setQInput}
          placeholder="Search job types…"
          ariaLabel="Search job types by name"
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
          rowKey={(t) => t.id}
          loading={loading}
          emptyMessage="No job types match this view."
          minWidth={640}
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
        title="Delete this job type?"
        description={deleting ? `"${deleting.name}" will be removed.` : null}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
