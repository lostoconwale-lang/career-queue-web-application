"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { ApiResponse } from "@/types/api";

type Status = "verifying" | "success" | "error";

// useSearchParams() requires a Suspense boundary — otherwise the whole route
// opts out of static rendering.
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            Verifying your <span className="text-brand font-light italic">email</span>
          </h1>
          <p className="text-muted mt-3">Hang tight, this only takes a moment.</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState<string | null>(
    token ? null : "This verification link is missing its token.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json()) as ApiResponse<{ verified: boolean }>;
        if (cancelled) return;
        if (json.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(json.error.message);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Something went wrong. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "verifying") {
    return (
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
          Verifying your <span className="text-brand font-light italic">email</span>
        </h1>
        <p className="text-muted mt-3">Hang tight, this only takes a moment.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
          Link <span className="text-brand font-light italic">expired</span>
        </h1>
        <p className="text-muted mt-3">
          {message ?? "This verification link is invalid or has expired."} You can request a new
          one from the login page.
        </p>
        <Link
          href="/login"
          className="bg-brand text-surface shadow-soft mt-8 inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Email <span className="text-brand font-light italic">verified</span>
      </h1>
      <p className="text-muted mt-3">
        Thanks for confirming your email address. Once an admin approves your account, you&apos;ll
        be able to log in.
      </p>
      <Link
        href="/"
        className="bg-brand text-surface shadow-soft mt-8 inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5"
      >
        Continue
      </Link>
    </div>
  );
}
