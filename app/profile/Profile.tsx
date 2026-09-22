"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

import { AuthField } from "@/app/_components/AuthField";
import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { LogOut } from "@/app/_components/Icons";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDate } from "@/lib/date";
import type { ApiResponse } from "@/types/api";
import type { UserDTO } from "@/types/user";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; user: UserDTO };

export function Profile() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/users/me", { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<UserDTO>>;
      })
      .then((json) => {
        if (!active || !json) return;
        if (json.success) {
          setState({ status: "ready", user: json.data });
          setName(json.data.name);
        } else {
          setState({ status: "error", message: json.error.message });
        }
      })
      .catch(() => {
        if (active) setState({ status: "error", message: "Could not load your profile." });
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveName() {
    if (state.status !== "ready") return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return;
    }
    setNameError(null);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/v1/users/${state.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<UserDTO>;
      if (json.success) {
        setState({ status: "ready", user: json.data });
        setSaved(true);
      } else {
        setNameError(json.error.message);
      }
    } catch {
      setNameError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordReset() {
    if (state.status !== "ready") return;
    setSendingReset(true);
    try {
      await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.user.email }),
      });
      setResetSent(true);
    } finally {
      setSendingReset(false);
      setConfirmingReset(false);
    }
  }

  function logout() {
    setSigningOut(true);
    void signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
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
        <>
          <div className="border-line bg-surface shadow-soft mt-10 rounded-2xl border p-6">
            <AuthField
              label="Name"
              name="name"
              autoComplete="name"
              value={name}
              error={nameError ?? undefined}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
            />

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={saveName}
                disabled={saving || name.trim() === state.user.name}
                className="bg-brand text-surface shadow-soft rounded-full px-6 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved ? <span className="text-brand text-sm font-medium">Saved</span> : null}
            </div>
          </div>

          <dl className="border-line divide-line bg-surface shadow-soft mt-6 divide-y rounded-2xl border">
            <Row label="Email" value={state.user.email} />
            <Row
              label="Mobile"
              value={
                state.user.phone
                  ? `${state.user.phone.countryCode} ${state.user.phone.number}`
                  : "—"
              }
            />
            <Row label="Approved" value={state.user.adminVerified ? "Yes" : "Pending"} />
            <Row label="Member since" value={formatDate(state.user.createdAt)} />
          </dl>
          <p className="text-muted mt-3 text-xs">
            Email and mobile number can&apos;t be changed here — contact support if either needs
            to be updated.
          </p>

          <div className="border-line bg-surface shadow-soft mt-6 flex items-center justify-between gap-4 rounded-2xl border p-6">
            <div>
              <h2 className="text-ink text-sm font-semibold">Password</h2>
              <p className="text-muted mt-1 text-sm">
                {resetSent
                  ? `We've sent a reset link to ${state.user.email}.`
                  : "We'll email you a link to choose a new one."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              disabled={resetSent}
              className="border-line text-ink hover:bg-cream shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetSent ? "Link sent" : "Change password"}
            </button>
          </div>

          <ConfirmDialog
            open={confirmingReset}
            busy={sendingReset}
            title="Reset your password?"
            description={`We'll send a password reset link to ${state.user.email}.`}
            confirmLabel="Send reset link"
            onConfirm={sendPasswordReset}
            onCancel={() => setConfirmingReset(false)}
          />

          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-coral/20 bg-coral/5 p-6">
            <div>
              <h2 className="text-ink text-sm font-semibold">Log out</h2>
              <p className="text-muted mt-1 text-sm">End your session on this device.</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmingLogout(true)}
              className="text-coral border-coral/30 hover:bg-coral/10 flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>

          <ConfirmDialog
            open={confirmingLogout}
            tone="danger"
            busy={signingOut}
            title="Log out?"
            description="You'll need to log in again to continue."
            confirmLabel="Log out"
            onConfirm={logout}
            onCancel={() => setConfirmingLogout(false)}
          />
        </>
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
