"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { Arrow } from "@/app/_components/Icons";
import { resetPasswordFormSchema } from "@/lib/validators/auth.validator";
import type { ApiResponse } from "@/types/api";

type FieldErrors = Partial<Record<"password" | "confirm", string>>;

// useSearchParams() requires a Suspense boundary — otherwise the whole route
// opts out of static rendering.
export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
          Link <span className="text-brand font-light italic">expired</span>
        </h1>
        <p className="text-muted mt-3">
          This reset link is missing its token. Request a new one from the login page.
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

  if (done) {
    return (
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
          Password <span className="text-brand font-light italic">updated</span>
        </h1>
        <p className="text-muted mt-3">You can now log in with your new password.</p>
        <Link
          href="/login"
          className="bg-brand text-surface shadow-soft mt-8 inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5"
        >
          Go to login
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = resetPasswordFormSchema.safeParse({ token, password, confirm });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ password: flat.password?.[0], confirm: flat.confirm?.[0] });
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as ApiResponse<{ reset: boolean }>;
      if (!json.success) {
        setFormError(json.error.message);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Choose a new <span className="text-brand font-light italic">password</span>
      </h1>
      <p className="text-muted mt-3">Make it something you haven&apos;t used before.</p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-6 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <AuthField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 5 characters"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <AuthField
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={confirm}
          error={errors.confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />

        <button
          type="submit"
          disabled={submitting}
          className="group bg-brand text-surface shadow-soft flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {submitting ? "Updating…" : "Update password"}
          {submitting ? null : (
            <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>
    </div>
  );
}
