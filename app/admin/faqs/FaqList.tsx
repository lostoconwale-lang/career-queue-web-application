"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { SearchInput } from "@/app/_components/SearchInput";
import { Select } from "@/app/_components/Select";
import { Table, type Column } from "@/app/_components/Table";
import { ActionButton, Switch } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDate, formatDateTime } from "@/lib/date";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { FaqDTO } from "@/types/faq";

type Status = "all" | "active" | "inactive";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function FaqList() {
  const router = useRouter();
  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState<{ q: string; status: Status }>({ q: "", status: "all" });

  const [data, setData] = useState<FaqDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [deleting, setDeleting] = useState<FaqDTO | null>(null);

  const filtersActive = query.status !== "all" || qInput.trim() !== "";

  function clearFilters() {
    setQInput("");
    setQuery({ q: "", status: "all" });
  }

  useEffect(() => {
    const next = qInput.trim();
    if (next === query.q) return;
    const t = setTimeout(() => setQuery((prev) => ({ ...prev, q: next })), 300);
    return () => clearTimeout(t);
  }, [qInput, query.q]);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ limit: "100" });
    if (query.q) params.set("q", query.q);
    if (query.status === "active") params.set("isActive", "true");
    if (query.status === "inactive") params.set("isActive", "false");

    fetch(`/api/v1/faqs?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<FaqDTO>>>;
      })
      .then((json) => {
        if (!alive || !json) return;
        if (json.success) {
          setData(json.data.items);
          setError(null);
        } else {
          setError(json.error.message);
        }
      })
      .catch(() => {
        if (alive) setError("Could not load FAQs.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [query, reloadKey]);

  async function toggleActive(faq: FaqDTO) {
    setBusyId(faq.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/faqs/${faq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<FaqDTO>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not update that FAQ. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/faqs/${deleting.id}`, { method: "DELETE" });
      if (redirectOnDenied(res)) return;
      if (!res.ok) {
        const json = (await res.json()) as ApiResponse<unknown>;
        setError(json.success ? "Could not delete that FAQ." : json.error.message);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not delete that FAQ. Please try again.");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  }

  const columns: Column<FaqDTO>[] = [
    {
      key: "sortOrder",
      header: "Order",
      className: "w-16",
      cell: (f) => <span className="text-muted tabular-nums">{f.sortOrder}</span>,
    },
    {
      key: "question",
      header: "Question",
      cell: (f) => (
        <div className="min-w-0">
          <p className="text-ink font-semibold">{f.question}</p>
          <p className="text-muted mt-0.5 line-clamp-2 max-w-xl text-xs">{f.answer}</p>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Active",
      cell: (f) => (
        <div className="flex items-center gap-2.5">
          <Switch
            checked={f.isActive}
            disabled={busyId === f.id}
            onChange={() => toggleActive(f)}
            label={`Toggle ${f.question}`}
          />
          <span className="text-muted text-xs">{f.isActive ? "Active" : "Inactive"}</span>
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (f) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(f.updatedAt)}>
          {formatDate(f.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (f) => (
        <div className="flex justify-end gap-2">
          <ActionButton
            disabled={busyId === f.id}
            onClick={() => router.push(`/admin/faqs/${f.id}/edit`)}
          >
            Edit
          </ActionButton>
          <ActionButton tone="danger" disabled={busyId === f.id} onClick={() => setDeleting(f)}>
            Delete
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="px-5 py-10 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            FAQs
          </h1>
          <p className="text-muted mt-2 text-sm">
            Questions and answers shown on the FAQ page, in the order below.
          </p>
        </div>
        <Link
          href="/admin/faqs/new"
          className="bg-brand text-surface shadow-soft shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          New FAQ
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Select
          value={query.status}
          onChange={(status) => setQuery((prev) => ({ ...prev, status: status as Status }))}
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
          placeholder="Search FAQs…"
          ariaLabel="Search FAQs by question or answer"
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
          rows={data ?? []}
          rowKey={(f) => f.id}
          loading={loading}
          emptyMessage="No FAQs match this view."
          minWidth={720}
        />
      </div>

      <ConfirmDialog
        open={deleting !== null}
        busy={deleting ? busyId === deleting.id : false}
        tone="danger"
        title="Delete this FAQ?"
        description={deleting ? `"${deleting.question}" will be removed from the FAQ page.` : null}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
