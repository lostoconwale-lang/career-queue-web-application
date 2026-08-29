"use client";

import { useEffect, useState } from "react";

import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDate } from "@/lib/date";
import type { ApiResponse } from "@/types/api";
import type { AdminDTO } from "@/types/admin";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; admin: AdminDTO };

export function AdminProfile() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/me", { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<AdminDTO>>;
      })
      .then((json) => {
        if (!active || !json) return;
        setState(
          json.success
            ? { status: "ready", admin: json.data }
            : { status: "error", message: json.error.message },
        );
      })
      .catch(() => {
        if (active) setState({ status: "error", message: "Could not load your profile." });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="px-5 py-10 sm:px-8">
      <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Account</p>
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Your profile
      </h1>

      {state.status === "loading" ? <p className="text-muted mt-10">Loading…</p> : null}

      {state.status === "error" ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-10 rounded-2xl border px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <dl className="border-line divide-line bg-surface shadow-soft mt-10 max-w-2xl divide-y rounded-2xl border">
          <Row label="Name" value={state.admin.name} />
          <Row label="Email" value={state.admin.email} />
          <Row
            label="Mobile"
            value={`${state.admin.phone.countryCode} ${state.admin.phone.number}`}
          />
          <Row label="Approved" value={state.admin.adminApproved ? "Yes" : "Pending"} />
          <Row label="Status" value={state.admin.isActive ? "Active" : "Deactivated"} />
          <Row label="Member since" value={formatDate(state.admin.createdAt)} />
        </dl>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <dt className="text-muted text-sm font-medium">{label}</dt>
      <dd className="text-ink text-sm font-semibold">{value}</dd>
    </div>
  );
}
