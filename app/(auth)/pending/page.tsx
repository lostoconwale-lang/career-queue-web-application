"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

// Shown right after phone verification during sign-up. The account still
// needs the email link clicked (and admin approval) before login works, but
// the email step is the one the user must act on right now.
//
// useSearchParams() requires a Suspense boundary — otherwise the whole route
// opts out of static rendering.
export default function PendingPage() {
  return (
    <Suspense
      fallback={
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            Loading…
          </h1>
        </div>
      }
    >
      <PendingContent />
    </Suspense>
  );
}

function PendingContent() {
  const email = useSearchParams().get("email") ?? "";
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    if (!email || sending) return;
    setSending(true);
    try {
      await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Verify your <span className="text-brand font-light italic">email</span>
      </h1>
      <p className="text-muted mt-3">
        {email ? (
          <>
            We&apos;ve sent a verification link to <span className="text-ink font-medium">{email}</span>.
          </>
        ) : (
          "We've sent a verification link to your email address."
        )}{" "}
        Open it and click the link to confirm your email — then you&apos;ll be able to log in.
      </p>

      {email ? (
        <button
          type="button"
          onClick={resend}
          disabled={sending || sent}
          className="border-line text-ink hover:bg-cream mt-6 inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sent ? "Link sent" : sending ? "Sending…" : "Resend verification email"}
        </button>
      ) : null}

      <div>
        <Link
          href="/"
          className="bg-brand text-surface shadow-soft mt-8 inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
