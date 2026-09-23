"use client";

import { useEffect, useState } from "react";

import { Select } from "@/app/_components/Select";
import { Table, type Column } from "@/app/_components/Table";
import { Pager } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import { ALERT_TYPES, ALERT_TYPE_LABELS, type AlertDTO, type AlertType } from "@/types/alert";
import type { ApiResponse, CursorPage } from "@/types/api";

const PAGE_SIZE = 15;

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  ...ALERT_TYPES.map((t) => ({ value: t, label: ALERT_TYPE_LABELS[t] })),
];

const READ_OPTIONS = [
  { value: "", label: "All alerts" },
  { value: "false", label: "Unread" },
  { value: "true", label: "Read" },
];

export function Alerts() {
  const [query, setQuery] = useState<{ type: AlertType | ""; read: "" | "true" | "false" }>({
    type: "",
    read: "",
  });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [data, setData] = useState<CursorPage<AlertDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    const cursor = cursors[cursors.length - 1];
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    if (query.type) params.set("type", query.type);
    if (query.read) params.set("read", query.read);

    fetch(`/api/v1/admin/alerts?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<AlertDTO>>>;
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
        if (alive) setError("Could not load alerts.");
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

  async function toggleRead(alert: AlertDTO) {
    setPendingIds((prev) => new Set(prev).add(alert.id));
    try {
      const res = await fetch(`/api/v1/admin/alerts/${alert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !alert.read }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<AlertDTO>;
      if (json.success) {
        setData((prev) =>
          prev
            ? { ...prev, items: prev.items.map((a) => (a.id === alert.id ? json.data : a)) }
            : prev,
        );
      }
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(alert.id);
        return next;
      });
    }
  }

  const columns: Column<AlertDTO>[] = [
    {
      key: "type",
      header: "Type",
      cell: (alert) => (
        <span className="bg-brand-soft text-brand rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
          {ALERT_TYPE_LABELS[alert.type]}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (alert) => (
        <div>
          <p className="text-ink font-semibold">{alert.userName}</p>
          <p className="text-muted text-xs">{alert.userEmail}</p>
        </div>
      ),
    },
    {
      key: "message",
      header: "Alert",
      cell: (alert) => (
        <div>
          <span className={alert.read ? "text-muted" : "text-ink font-medium"}>
            {alert.message}
          </span>
          {alert.read && alert.readBy ? (
            <p
              className="text-muted mt-0.5 text-xs"
              title={alert.readAt ? formatDateTime(alert.readAt) : undefined}
            >
              Read by {alert.readBy.name} ({alert.readBy.email})
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "When",
      cell: (alert) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(alert.createdAt)}>
          {formatRelativeTime(alert.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-36",
      cell: (alert) => (
        <button
          type="button"
          onClick={() => toggleRead(alert)}
          disabled={pendingIds.has(alert.id)}
          className="border-line text-ink hover:bg-cream rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50"
        >
          {alert.read ? "Mark unread" : "Mark read"}
        </button>
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
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Alerts
      </h1>
      <p className="text-muted mt-2 text-sm">
        Notifications for account registrations, password changes, first logins and job
        applications.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Select
          value={query.type}
          onChange={(type) => {
            setQuery((prev) => ({ ...prev, type: type as AlertType | "" }));
            setCursors([null]);
          }}
          options={TYPE_OPTIONS}
          ariaLabel="Filter by type"
          className="w-full sm:w-52"
        />
        <Select
          value={query.read}
          onChange={(read) => {
            setQuery((prev) => ({ ...prev, read: read as "" | "true" | "false" }));
            setCursors([null]);
          }}
          options={READ_OPTIONS}
          ariaLabel="Filter by read status"
          className="w-full sm:w-44"
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
          rowKey={(alert) => alert.id}
          loading={loading}
          emptyMessage="No alerts match this view."
          minWidth={820}
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
