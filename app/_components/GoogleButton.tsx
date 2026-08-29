"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { Google } from "./Icons";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", { callbackUrl: "/onboarding" });
      }}
      className="border-line text-ink hover:bg-cream flex w-full items-center justify-center gap-3 rounded-full border px-7 py-3.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Google className="h-5 w-5" />
      {pending ? "Redirecting…" : label}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="bg-line h-px flex-1" />
      <span className="text-muted text-xs font-medium tracking-wide uppercase">or</span>
      <span className="bg-line h-px flex-1" />
    </div>
  );
}
