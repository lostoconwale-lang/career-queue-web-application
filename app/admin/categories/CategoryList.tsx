"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { Photo } from "@/app/_components/Icons";
import { SearchInput } from "@/app/_components/SearchInput";
import { Table, type Column } from "@/app/_components/Table";
import { ActionButton, Pager, Switch } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { CategoryDTO } from "@/types/category";

type Filter = "all" | "active" | "inactive";

const PAGE_SIZE = 15;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

export function CategoryList() {
  const router = useRouter();
  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState<{ q: string; filter: Filter }>({ q: "", filter: "all" });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [data, setData] = useState<CursorPage<CategoryDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [deleting, setDeleting] = useState<CategoryDTO | null>(null);

  function applyQuery(patch: Partial<typeof query>) {
    setQuery((prev) => ({ ...prev, ...patch }));
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
    if (query.filter === "active") params.set("isActive", "true");
    if (query.filter === "inactive") params.set("isActive", "false");

    fetch(`/api/v1/categories?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<CategoryDTO>>>;
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
        if (alive) setError("Could not load categories.");
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

  async function toggleActive(category: CategoryDTO) {
    setBusyId(category.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<CategoryDTO>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not update that category. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/categories/${deleting.id}`, { method: "DELETE" });
      if (redirectOnDenied(res)) return;
      if (!res.ok) {
        const json = (await res.json()) as ApiResponse<unknown>;
        setError(json.success ? "Could not delete that category." : json.error.message);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not delete that category. Please try again.");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  }

  const columns: Column<CategoryDTO>[] = [
    {
      key: "icon",
      header: "",
      className: "w-14",
      cell: (c) =>
        c.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.icon.url}
            alt=""
            className="border-line bg-cream h-9 w-9 rounded-lg border object-contain p-0.5"
          />
        ) : (
          <span className="border-line bg-cream text-muted/50 grid h-9 w-9 place-items-center rounded-lg border">
            <Photo className="h-4 w-4" />
          </span>
        ),
    },
    {
      key: "name",
      header: "Category",
      cell: (c) => <span className="text-ink font-semibold">{c.name}</span>,
    },
    {
      key: "isActive",
      header: "Active",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Switch
            checked={c.isActive}
            disabled={busyId === c.id}
            onChange={() => toggleActive(c)}
            label={`Toggle ${c.name}`}
          />
          <span className="text-muted text-xs">{c.isActive ? "Active" : "Inactive"}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Added",
      cell: (c) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(c.createdAt)}>
          {formatRelativeTime(c.createdAt)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (c) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(c.updatedAt)}>
          {formatRelativeTime(c.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (c) => (
        <div className="flex justify-end gap-2">
          <ActionButton
            disabled={busyId === c.id}
            onClick={() => router.push(`/admin/categories/${c.id}/edit`)}
          >
            Edit
          </ActionButton>
          <ActionButton tone="danger" disabled={busyId === c.id} onClick={() => setDeleting(c)}>
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
            Categories
          </h1>
          <p className="text-muted mt-2 text-sm">
            The job categories shown across the job board. Turn one off to hide it without deleting.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="bg-brand text-surface shadow-soft shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          New category
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="bg-cream flex gap-1 rounded-2xl p-1 text-sm">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => applyQuery({ filter: f.key })}
              aria-pressed={query.filter === f.key}
              className={`rounded-2xl px-3.5 py-1.5 font-medium transition-colors ${
                query.filter === f.key
                  ? "bg-surface text-ink shadow-soft"
                  : "text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchInput
          value={qInput}
          onChange={setQInput}
          placeholder="Search categories…"
          ariaLabel="Search categories by name"
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
          rowKey={(c) => c.id}
          loading={loading}
          emptyMessage="No categories match this view."
          minWidth={720}
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
        title="Delete this category?"
        description={deleting ? `"${deleting.name}" will be removed from the job board.` : null}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
