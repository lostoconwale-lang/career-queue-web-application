"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { AuthField } from "@/app/_components/AuthField";
import { Arrow } from "@/app/_components/Icons";
import { adminLoginBodySchema } from "@/lib/validators/admin.validator";
import type { ApiResponse } from "@/types/api";

type FieldKey = "email" | "password";
type FieldErrors = Partial<Record<FieldKey, string>>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: FieldKey) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = adminLoginBodySchema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      // 1. Validate credentials + surface the real reason (bad password vs.
      //    awaiting approval vs. deactivated).
      const res = await fetch("/api/v1/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) {
        setFormError(json.error.message);
        return;
      }

      // 2. Establish the browser session via the admin provider.
      const outcome = await signIn("admin-login", {
        redirect: false,
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (outcome?.error) {
        setFormError("Could not start your session. Please try again.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Admin</p>
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Console <span className="text-brand font-light italic">login</span>
      </h1>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-6 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <AuthField
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          error={errors.email}
          onChange={update("email")}
        />

        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          error={errors.password}
          onChange={update("password")}
        />

        <button
          type="submit"
          disabled={submitting}
          className="group bg-brand text-surface shadow-soft flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {submitting ? "Logging in…" : "Log in"}
          {submitting ? null : (
            <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>

      <p className="text-muted mt-8 text-center text-sm">
        Need an admin account?{" "}
        <Link href="/admin/register" className="text-brand font-semibold hover:underline">
          Request access
        </Link>
      </p>
    </div>
  );
}
