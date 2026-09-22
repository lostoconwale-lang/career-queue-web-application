"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "@/app/_components/AuthField";
import { emailInputSchema } from "@/lib/validators/common";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Only mounted while `open` — that gives each opening a fresh component
// instance (blank form, no leftover "sent" state) without an effect to reset it.
export function ForgotPasswordDialog({ open, onClose }: Props) {
  if (!open) return null;
  return <ForgotPasswordDialogContent onClose={onClose} />;
}

// Same overlay/card shell as ConfirmDialog, but collects an email instead of
// just confirming — "forgot password" needs the address before it can send
// anything.
function ForgotPasswordDialogContent({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [submitting, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = emailInputSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data }),
      });
      // Always show the same success state — the endpoint itself never
      // reveals whether the address has an account.
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={() => !submitting && onClose()}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        className="bg-surface shadow-lift relative w-full max-w-sm rounded-3xl p-6"
      >
        {sent ? (
          <>
            <h2 id="forgot-password-title" className="font-display text-ink text-xl font-semibold">
              Check your email
            </h2>
            <p className="text-muted mt-2 text-sm">
              If an account exists for <span className="text-ink font-medium">{email}</span>,
              we&apos;ve sent a link to reset your password.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-brand text-surface rounded-full px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="forgot-password-title" className="font-display text-ink text-xl font-semibold">
              Reset your password
            </h2>
            <p className="text-muted mt-2 text-sm">
              Enter your email and we&apos;ll send you a link to choose a new password.
            </p>

            <div className="mt-5">
              <AuthField
                label="Email"
                name="reset-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                error={error ?? undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="border-line text-ink hover:bg-cream rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand text-surface rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
