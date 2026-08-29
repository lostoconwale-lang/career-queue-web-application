"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { AuthField } from "@/app/_components/AuthField";
import { AuthDivider, GoogleButton } from "@/app/_components/GoogleButton";
import { Arrow } from "@/app/_components/Icons";
import { buildLoginPayload, loginFormSchema } from "@/lib/validators/auth.validator";

type Method = "email" | "mobile";
type FieldErrors = Partial<Record<"email" | "mobile" | "password", string>>;

export default function LoginPage() {
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function switchMethod(next: Method) {
    setMethod(next);
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
    const payload = buildLoginPayload(parsed.data);
    window.alert(JSON.stringify(payload, null, 2));
  }

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Welcome <span className="text-brand font-light italic">back</span>
      </h1>
      <p className="text-muted mt-3">Log in to your account.</p>

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

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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

        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
          trailing={
            <Link href="/login" className="text-brand text-sm font-medium hover:underline">
              Forgot password?
            </Link>
          }
        />

        <button
          type="submit"
          className="group bg-brand text-surface shadow-soft flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5"
        >
          Log in
          <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </form>

      <AuthDivider />
      <GoogleButton />

      <p className="text-muted mt-8 text-center text-sm">
        Don’t have an account??{" "}
        <Link href="/register" className="text-brand font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
