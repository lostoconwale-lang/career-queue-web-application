"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { SearchInput } from "@/app/_components/SearchInput";
import { Table, type Column } from "@/app/_components/Table";
import { ActionButton, Badge, Pager } from "@/app/admin/_components/table-ui";
import { CreateUserDialog } from "./CreateUserDialog";
import { SetPasswordDialog } from "./SetPasswordDialog";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { UserDTO } from "@/types/user";

type Filter = "all" | "pending" | "active" | "suspended";
type ModAction = "approve" | "reject" | "activate" | "deactivate";

const PAGE_SIZE = 10;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending approval" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
];

const REG_LABEL: Record<UserDTO["registrationType"], string> = {
  manual: "Sign-up",
  admin: "Admin-created",
  google: "Google",
};

const PATCH: Record<ModAction, Record<string, unknown>> = {
  approve: { adminVerified: true, status: "active" },
  reject: { adminVerified: false, status: "suspended" },
  activate: { status: "active" },
  deactivate: { status: "suspended" },
};

const CONFIRM: Record<
  ModAction,
  { title: string; confirmLabel: string; tone: "brand" | "danger"; body: (name: string) => string }
> = {
  approve: {
    title: "Approve this user?",
    confirmLabel: "Approve",
    tone: "brand",
    body: (n) => `${n} will be able to sign in immediately.`,
  },
  reject: {
    title: "Reject this user?",
    confirmLabel: "Reject",
    tone: "danger",
    body: (n) => `${n} will be suspended and won't be able to sign in. You can approve them later.`,
  },
  activate: {
    title: "Reactivate this user?",
    confirmLabel: "Activate",
    tone: "brand",
    body: (n) => `${n} will regain access and can sign in again.`,
  },
  deactivate: {
    title: "Deactivate this user?",
    confirmLabel: "Deactivate",
    tone: "danger",
    body: (n) => `${n} will be blocked from signing in until reactivated.`,
  },
};

export function AdminUsers() {
  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState<{ q: string; filter: Filter }>({ q: "", filter: "all" });
  // Cursor stack: cursors[i] starts page i (cursors[0] === null → first page).
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [data, setData] = useState<CursorPage<UserDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [settingPw, setSettingPw] = useState<UserDTO | null>(null);

  const [confirming, setConfirming] = useState<{ user: UserDTO; action: ModAction } | null>(null);

  function applyQuery(patch: Partial<typeof query>) {
    setQuery((prev) => ({ ...prev, ...patch }));
    setCursors([null]);
  }

  // Debounce the search box; only re-query when the trimmed term actually changes.
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
    if (query.filter === "pending") params.set("adminVerified", "false");
    if (query.filter === "active") params.set("status", "active");
    if (query.filter === "suspended") params.set("status", "suspended");

    fetch(`/api/v1/users?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<UserDTO>>>;
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
        if (alive) setError("Could not load users.");
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

  async function runAction(id: string, action: ModAction): Promise<boolean> {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(PATCH[action]),
      });
      if (redirectOnDenied(res)) return false;
      const json = (await res.json()) as ApiResponse<UserDTO>;
      if (!json.success) {
        setError(json.error.message);
        return false;
      }
      setReloadKey((k) => k + 1);
      return true;
    } catch {
      setError("That action failed. Please try again.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function onModerate(user: UserDTO, action: ModAction) {
    setConfirming({ user, action });
  }

  async function confirmAction() {
    if (!confirming) return;
    await runAction(confirming.user.id, confirming.action);
    setConfirming(null);
  }

  const columns: Column<UserDTO>[] = [
    { key: "name", header: "Name", cell: (u) => <span className="font-semibold">{u.name}</span> },
    { key: "email", header: "Email", cell: (u) => <span className="text-muted">{u.email}</span> },
    {
      key: "phone",
      header: "Mobile",
      cell: (u) => (
        <span className="text-muted">
          {u.phone ? `${u.phone.countryCode} ${u.phone.number}` : "—"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Source",
      cell: (u) => <span className="text-muted">{REG_LABEL[u.registrationType]}</span>,
    },
    { key: "approval", header: "Approval", cell: (u) => <ApprovalBadge user={u} /> },
    {
      key: "access",
      header: "Access",
      cell: (u) =>
        u.status === "active" ? (
          <Badge tone="neutral">Active</Badge>
        ) : (
          <Badge tone="danger">Suspended</Badge>
        ),
    },
    {
      key: "createdAt",
      header: "Joined",
      cell: (u) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(u.createdAt)}>
          {formatRelativeTime(u.createdAt)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (u) => (
        <span className="text-muted whitespace-nowrap" title={formatDateTime(u.updatedAt)}>
          {formatRelativeTime(u.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (u) => (
        <RowActions
          user={u}
          busy={busyId === u.id}
          onModerate={onModerate}
          onSetPassword={setSettingPw}
        />
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
        <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
          Users
        </h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="bg-brand text-surface shadow-soft shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          New user
        </button>
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
          placeholder="Search by name, email or mobile…"
          ariaLabel="Search users by name, email or mobile"
          className="ml-auto w-full sm:w-72 lg:w-96"
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
          rowKey={(u) => u.id}
          loading={loading}
          emptyMessage="No users match this view."
          minWidth={1120}
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
        open={confirming !== null}
        busy={confirming ? busyId === confirming.user.id : false}
        tone={confirming ? CONFIRM[confirming.action].tone : "brand"}
        title={confirming ? CONFIRM[confirming.action].title : ""}
        description={confirming ? CONFIRM[confirming.action].body(confirming.user.name) : null}
        confirmLabel={confirming ? CONFIRM[confirming.action].confirmLabel : "Confirm"}
        onConfirm={confirmAction}
        onCancel={() => setConfirming(null)}
      />

      {creating ? (
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}

      {settingPw ? (
        <SetPasswordDialog
          user={settingPw}
          onClose={() => setSettingPw(null)}
          onDone={() => setSettingPw(null)}
        />
      ) : null}
    </div>
  );
}

function ApprovalBadge({ user }: { user: UserDTO }) {
  if (user.adminVerified) return <Badge tone="brand">Approved</Badge>;
  if (user.status === "suspended") return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
}

function RowActions({
  user,
  busy,
  onModerate,
  onSetPassword,
}: {
  user: UserDTO;
  busy: boolean;
  onModerate: (user: UserDTO, action: ModAction) => void;
  onSetPassword: (user: UserDTO) => void;
}) {
  const rejected = !user.adminVerified && user.status === "suspended";
  const pending = !user.adminVerified && user.status === "active";

  return (
    <div className="flex justify-end gap-2">
      <ActionButton disabled={busy} onClick={() => onSetPassword(user)}>
        Password
      </ActionButton>

      {pending ? (
        <>
          <ActionButton disabled={busy} onClick={() => onModerate(user, "approve")}>
            Approve
          </ActionButton>
          <ActionButton tone="danger" disabled={busy} onClick={() => onModerate(user, "reject")}>
            Reject
          </ActionButton>
        </>
      ) : null}

      {rejected ? (
        <ActionButton disabled={busy} onClick={() => onModerate(user, "approve")}>
          Approve
        </ActionButton>
      ) : null}

      {user.adminVerified ? (
        user.status === "active" ? (
          <ActionButton
            tone="danger"
            disabled={busy}
            onClick={() => onModerate(user, "deactivate")}
          >
            Deactivate
          </ActionButton>
        ) : (
          <ActionButton disabled={busy} onClick={() => onModerate(user, "activate")}>
            Activate
          </ActionButton>
        )
      ) : null}
    </div>
  );
}

