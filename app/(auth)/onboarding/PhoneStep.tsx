"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { Arrow } from "@/app/_components/Icons";
import { completeProfileFormSchema } from "@/lib/validators/auth.validator";
import type { ApiResponse } from "@/types/api";
import type { UserDTO } from "@/types/user";

export function PhoneStep() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    const parsed = completeProfileFormSchema.safeParse({ mobile });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.mobile?.[0]);
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as ApiResponse<UserDTO>;

      if (!json.success) {
        setError(json.error.details?.phone?.[0] ?? json.error.message);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
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
        error={error}
        onChange={(event) => setMobile(event.target.value)}
      />

      <button
        type="submit"
        disabled={submitting}
        className="group bg-brand text-surface shadow-soft flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {submitting ? "Saving…" : "Finish"}
        {submitting ? null : (
          <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        )}
      </button>
    </form>
  );
}
