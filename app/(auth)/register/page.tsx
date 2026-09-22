"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { OtpInput } from "@/app/_components/OtpInput";
// Google sign-in is disabled for now — re-enable this import when it ships.
// import { AuthDivider, GoogleButton } from "@/app/_components/GoogleButton";
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

  // Set once registration succeeds — switches the page into the OTP step.
  // Registration isn't considered complete until this is verified.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const update = (key: FieldKey) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

      setRegisteredEmail(parsed.data.email);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registeredEmail) {
    return <VerifyPhoneStep email={registeredEmail} onVerified={() => router.push("/pending")} />;
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

      {/* Google sign-in is disabled for now — re-enable when it ships.
      <AuthDivider />
      <GoogleButton label="Sign up with Google" /> */}

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

// Registration isn't complete until this succeeds — there's no way past this
// step to /pending without the correct code (currently always "1234", see
// lib/auth/otp.ts; a real SMS gateway will replace the stub in lib/sms/send-sms.ts).
function VerifyPhoneStep({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  async function verify(code: string) {
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/v1/auth/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const json = (await res.json()) as ApiResponse<{ verified: boolean }>;
      if (json.success) {
        onVerified();
      } else {
        setError(json.error.message);
        setOtp("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setOtp("");
    } finally {
      setVerifying(false);
    }
  }

  // Auto-submits the moment all 4 digits are entered — no extra tap needed.
  function handleOtpChange(next: string) {
    setOtp(next);
    if (next.length === 4 && !verifying) void verify(next);
  }

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}$/.test(otp)) {
      setError("Enter the 4-digit code");
      return;
    }
    void verify(otp);
  }

  async function handleResend() {
    setResending(true);
    setOtp("");
    setError(null);
    try {
      await fetch("/api/v1/auth/resend-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResent(true);
      setError(null);
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Verify your <span className="text-brand font-light italic">phone</span>
      </h1>
      <p className="text-muted mt-3">
        We&apos;ve sent a 4-digit code by SMS to the mobile number you entered. Enter it below to
        finish creating your account.
      </p>

      <form onSubmit={handleVerify} className="mt-8" noValidate>
        <OtpInput value={otp} onChange={handleOtpChange} error={Boolean(error)} disabled={verifying} />

        {error ? <p className="text-coral mt-4 text-center text-sm">{error}</p> : null}

        <button
          type="submit"
          disabled={verifying || otp.length < 4}
          className="group bg-brand text-surface shadow-soft mt-6 flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {verifying ? "Verifying…" : "Verify phone"}
          {verifying ? null : (
            <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="text-brand mt-6 block text-center text-sm font-medium hover:underline disabled:opacity-60"
      >
        {resent ? "Code resent" : resending ? "Sending…" : "Resend code"}
      </button>
    </div>
  );
}
