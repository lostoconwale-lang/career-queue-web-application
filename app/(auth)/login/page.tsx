"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { AuthField } from "@/app/_components/AuthField";
// Google sign-in is disabled for now — re-enable this import when it ships.
// import { AuthDivider, GoogleButton } from "@/app/_components/GoogleButton";
import { ForgotPasswordDialog } from "@/app/_components/ForgotPasswordDialog";
import { VerifyEmailPromptDialog } from "@/app/_components/VerifyEmailPromptDialog";
import { VerifyPhoneDialog } from "@/app/_components/VerifyPhoneDialog";
import { Arrow } from "@/app/_components/Icons";
import { buildLoginPayload, loginFormSchema, type LoginBody } from "@/lib/validators/auth.validator";
import type { ApiResponse } from "@/types/api";

type Method = "email" | "mobile";
type FieldErrors = Partial<Record<"email" | "mobile" | "password", string>>;

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [emailPromptOpen, setEmailPromptOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);

  // The most recent attempt — replayed once the phone-verify popup succeeds,
  // so the user doesn't have to re-type their password.
  const [pendingLogin, setPendingLogin] = useState<LoginBody | null>(null);

  function switchMethod(next: Method) {
    setMethod(next);
    setErrors({});
    setFormError(null);
  }

  async function attemptLogin(payload: LoginBody) {
    setFormError(null);
    setSubmitting(true);

    try {
      // 1. Validate credentials + surface the real reason (bad password vs.
      //    awaiting approval vs. unverified email/phone vs. Google-only account).
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) {
        if (json.error.code === "PHONE_NOT_VERIFIED") {
          setPendingLogin(payload);
          setPhoneDialogOpen(true);
          return;
        }
        if (json.error.code === "EMAIL_NOT_VERIFIED") {
          setPendingLogin(payload);
          setEmailPromptOpen(true);
          return;
        }
        setFormError(json.error.message);
        return;
      }

      // 2. Establish the browser session via the credentials provider. Only
      //    the relevant identifier key is included — `signIn` serializes
      //    every option to a string, so an `email: undefined` here would
      //    become the literal string "undefined" and get picked up as a
      //    (bogus, truthy) email on the other side.
      const outcome = await signIn("credentials", {
        redirect: false,
        password: payload.password,
        ...(payload.email ? { email: payload.email } : { phoneNumber: payload.phone?.number }),
      });
      if (outcome?.error) {
        setFormError("Could not start your session. Please try again.");
        return;
      }

      router.push("/jobs");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const input = method === "email" ? { method, email, password } : { method, mobile, password };

    const parsed = loginFormSchema.safeParse(input);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        email: flat.email?.[0],
        mobile: flat.mobile?.[0],
        password: flat.password?.[0],
      });
      return;
    }

    setErrors({});
    void attemptLogin(buildLoginPayload(parsed.data));
  }

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Welcome <span className="text-brand font-light italic">back</span>
      </h1>
      <p className="text-muted mt-3">Log in to your account.</p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-6 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <div className="bg-cream mt-8 flex gap-1 rounded-2xl p-1 text-sm">
        {(["email", "mobile"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => switchMethod(option)}
            aria-pressed={method === option}
            className={`flex-1 rounded-2xl px-4 py-2 font-medium transition-colors ${
              method === option ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink"
            }`}
          >
            {option === "email" ? "Email" : "Mobile"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {method === "email" ? (
          <AuthField
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={errors.email}
            onChange={(event) => setEmail(event.target.value)}
          />
        ) : (
          <AuthField
            label="Mobile number"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            prefix="+91"
            placeholder="98765 43210"
            value={mobile}
            error={errors.mobile}
            onChange={(event) => setMobile(event.target.value)}
          />
        )}

        <div>
          <AuthField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={errors.password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-brand mt-2 text-sm font-medium hover:underline"
          >
            Forgot password?
          </button>
        </div>

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

      {/* Google sign-in is disabled for now — re-enable when it ships.
      <AuthDivider />
      <GoogleButton /> */}

      <p className="text-muted mt-8 text-center text-sm">
        Don’t have an account??{" "}
        <Link href="/register" className="text-brand font-semibold hover:underline">
          Create one
        </Link>
      </p>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />

      <VerifyEmailPromptDialog
        open={emailPromptOpen}
        onClose={() => setEmailPromptOpen(false)}
      />

      {pendingLogin ? (
        <VerifyPhoneDialog
          open={phoneDialogOpen}
          identifier={{ email: pendingLogin.email, phone: pendingLogin.phone }}
          onClose={() => setPhoneDialogOpen(false)}
          onVerified={() => {
            setPhoneDialogOpen(false);
            void attemptLogin(pendingLogin);
          }}
        />
      ) : null}
    </div>
  );
}
