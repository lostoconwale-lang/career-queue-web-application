"use client";

import { useEffect, useState } from "react";

import { SearchInput } from "@/app/_components/SearchInput";
import { Select } from "@/app/_components/Select";
import { Table, type Column } from "@/app/_components/Table";
import { Pager } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import {
  ACTIVITY_LOG_TYPES,
  type ActivityLogCategory,
  type ActivityLogType,
} from "@/types/activity-log";
import type { ActivityLogDTO } from "@/types/activity-log";
import type { ApiResponse, CursorPage } from "@/types/api";

const PAGE_SIZE = 15;

const TYPE_LABELS: Record<ActivityLogType, string> = {
  user: "Users",
  admin: "Admins",
  auth: "Authentication",
  city: "Cities",
  category: "Categories",
  "job-type": "Job types",
  job: "Jobs",
  company: "Companies",
  "job-application": "Applications",
  testimonial: "Testimonials",
  faq: "FAQs",
  "static-page": "Pages",
  settings: "Settings",
  media: "Media",
};

const TYPE_OPTIONS = [
  { value: "", label: "All areas" },
  ...ACTIVITY_LOG_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
];

const CATEGORY_DOT: Record<ActivityLogCategory, string> = {
  create: "bg-emerald-500",
  read: "bg-sky-500",
  update: "bg-amber-500",
  delete: "bg-rose-500",
};

export function ActivityLogs() {
  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState<{ q: string; type: ActivityLogType | "" }>({
    q: "",
    type: "",
  });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [data, setData] = useState<CursorPage<ActivityLogDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (query.type) params.set("type", query.type);

    fetch(`/api/v1/admin/activity?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<ActivityLogDTO>>>;
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
        if (alive) setError("Could not load activity logs.");
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

  const columns: Column<ActivityLogDTO>[] = [
    {
      key: "category",
      header: "",
      className: "w-8",
      cell: (log) => <CategoryDot category={log.category} />,
    },
    {
      key: "admin",
      header: "Admin",
      cell: (log) => (
        <div>
          <p className="text-ink font-semibold">{log.adminName}</p>
          <p className="text-muted text-xs">
            {log.adminEmail} · {log.adminMobile}
          </p>
        </div>
      ),
    },
    {
      key: "area",
      header: "Area",
      cell: (log) => <span className="text-muted">{TYPE_LABELS[log.type]}</span>,
    },
    {
      key: "message",
      header: "Activity",
      cell: (log) => <span className="text-ink">{log.message}</span>,
    },
    {
      key: "createdAt",
      header: "When",
      cell: (log) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(log.createdAt)}>
          {formatRelativeTime(log.createdAt)}
        </span>
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
        Activity logs
      </h1>
      <p className="text-muted mt-2 text-sm">
        Every create, update and delete action taken by an admin. Kept for 12 months.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Select
          value={query.type}
          onChange={(type) => {
            setQuery((prev) => ({ ...prev, type: type as ActivityLogType | "" }));
            setCursors([null]);
          }}
          options={TYPE_OPTIONS}
          ariaLabel="Filter by area"
          className="w-full sm:w-52"
        />

        <SearchInput
          value={qInput}
          onChange={setQInput}
          placeholder="Search activity, admin or mobile…"
          ariaLabel="Search activity logs"
          className="ml-auto w-full sm:w-72 lg:w-80"
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
          rowKey={(log) => log.id}
          loading={loading}
          emptyMessage="No activity matches this view."
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

function CategoryDot({ category }: { category: ActivityLogCategory }) {
  return (
    <span
      className="flex items-center"
      title={category.charAt(0).toUpperCase() + category.slice(1)}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${CATEGORY_DOT[category]}`} />
      <span className="sr-only">{category}</span>
    </span>
  );
}
