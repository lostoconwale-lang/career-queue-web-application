"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";

import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { AdminOverview } from "@/types/admin";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AdminOverview };

export function AdminDashboard({ adminName }: { adminName: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/overview", { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<AdminOverview>>;
      })
      .then((json) => {
        if (!active || !json) return;
        setState(
          json.success
            ? { status: "ready", data: json.data }
            : { status: "error", message: json.error.message },
        );
      })
      .catch(() => {
        if (active) setState({ status: "error", message: "Could not load the dashboard." });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="px-5 py-10 sm:px-8">
      <section className="border-line from-brand-soft via-cream to-cream relative overflow-hidden rounded-3xl border bg-gradient-to-br">
        <span
          aria-hidden
          className="bg-brand/10 absolute -top-10 right-1/3 h-40 w-40 rounded-full blur-3xl"
        />
        <div className="relative z-10 max-w-lg px-6 py-9 sm:px-10 sm:py-12">
          <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back, <span className="text-brand font-semibold">{adminName}</span>
          </h1>
          <p className="text-muted mt-3 max-w-xs text-sm sm:text-base">
            Here&apos;s a snapshot of what&apos;s happening across the platform.
          </p>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[26%] sm:block">
          <Image
            src="/images/admin-dashboard-hero.webp"
            alt=""
            fill
            priority
            sizes="640px"
            className="object-cover object-right"
          />
        </div>
      </section>

      {state.status === "loading" ? <p className="text-muted mt-8">Loading…</p> : null}

      {state.status === "error" ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-10 rounded-2xl border px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <div className="mt-10 space-y-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Users"
              href="/admin/users"
              image="/images/dashboard-users.webp"
              total={state.data.users.total}
              pending={state.data.users.pendingApproval}
              pendingLabel="awaiting approval"
            />
            <StatCard
              label="Admins"
              href="/admin/admins/users"
              image="/images/dashboard-admins.webp"
              total={state.data.admins.total}
              pending={state.data.admins.pendingApproval}
              pendingLabel="awaiting approval"
            />
            <StatCard
              label="Categories"
              href="/admin/categories"
              image="/images/category-illustration.webp"
              total={state.data.categories.total}
              pending={state.data.categories.inactive}
              pendingLabel="inactive"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  total,
  pending,
  pendingLabel,
  href,
  image,
}: {
  label: string;
  total: number;
  pending: number;
  pendingLabel: string;
  image: string;
  href?: ComponentProps<typeof Link>["href"];
}) {
  const body = (
    <div className="flex items-start gap-5">
      <span className="bg-brand-soft ring-line/60 relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-1">
        <Image src={image} alt="" fill sizes="80px" className="object-cover" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-muted text-sm font-medium">{label}</p>
        <p className="text-ink font-display mt-1 text-4xl font-semibold tabular-nums">{total}</p>

        <div className="mt-3">
          {pending > 0 ? (
            <span className="bg-coral/10 text-coral inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
              <span className="bg-coral h-1.5 w-1.5 rounded-full" />
              {pending} {pendingLabel}
            </span>
          ) : (
            <span className="text-muted text-xs">All caught up</span>
          )}
        </div>
      </div>
    </div>
  );
  const className =
    "border-line bg-surface shadow-soft relative block overflow-hidden rounded-2xl border p-6";
  return href ? (
    <Link
      href={href}
      className={`${className} hover:border-brand/40 hover:shadow-lift group transition-all`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
