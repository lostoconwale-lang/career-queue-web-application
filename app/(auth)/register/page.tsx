"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { AuthDivider, GoogleButton } from "@/app/_components/GoogleButton";
import { Arrow } from "@/app/_components/Icons";
import { registerFormSchema } from "@/lib/validators/auth.validator";
import type { ApiResponse } from "@/types/api";
import type { UserDTO } from "@/types/user";

type FieldKey = "name" | "email" | "mobile" | "password";
type FieldErrors = Partial<Record<FieldKey, string>>;

const initial = { name: "", email: "", mobile: "", password: "" };

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const update = (key: FieldKey) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = registerFormSchema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        mobile: flat.mobile?.[0],
        password: flat.password?.[0],
      });
      return;
    }
    setErrors({});
    setConfirming(true);
  }

  async function createAccount() {
    const parsed = registerFormSchema.safeParse(form);
    if (!parsed.success) {
      setConfirming(false);
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as ApiResponse<{ user: UserDTO }>;

      if (!json.success) {
        const details = json.error.details ?? {};
        setErrors({
          name: details.name?.[0],
          email: details.email?.[0],
          mobile: details.phone?.[0],
          password: details.password?.[0],
        });
        if (!Object.keys(details).length) setFormError(json.error.message);
        return;
      }

      router.push("/pending");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Create your <span className="text-brand font-light italic">account</span>
      </h1>
     
      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-6 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <AuthField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="First Last"
          value={form.name}
          error={errors.name}
          onChange={update("name")}
        />

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
          label="Mobile number"
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          prefix="+91"
          placeholder="98765 43210"
          value={form.mobile}
          error={errors.mobile}
          onChange={update("mobile")}
        />

        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 5 characters"
          value={form.password}
          error={errors.password}
          onChange={update("password")}
        />

        <button
          type="submit"
          disabled={submitting || confirming}
          className="group bg-brand text-surface shadow-soft flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {submitting ? "Creating account…" : "Create account"}
          {submitting ? null : (
            <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>

      <AuthDivider />
      <GoogleButton label="Sign up with Google" />

      <p className="text-muted mt-8 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          Log in
        </Link>
      </p>

      <ConfirmDialog
        open={confirming}
        busy={submitting}
        title="Create your account?"
        description={`We'll set up an account for ${form.email} and send it for approval.`}
        confirmLabel="Create account"
        onConfirm={createAccount}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
