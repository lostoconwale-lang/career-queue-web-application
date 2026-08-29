"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Image from "next/image";

import { AuthField } from "@/app/_components/AuthField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { setUserPasswordFormSchema } from "@/lib/validators/user.validator";
import type { ApiResponse } from "@/types/api";

type FieldKey = "password" | "confirm";

const initial = { password: "", confirm: "" };

export function SetPasswordDialog({
  user,
  onClose,
  onDone,
}: {
  user: { id: string; name: string };
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [submitting, onClose]);

  const update = (key: FieldKey) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function validateField(key: FieldKey) {
    const result = setUserPasswordFormSchema.safeParse(form);
    const message = result.success ? undefined : result.error.flatten().fieldErrors[key]?.[0];
    setErrors((prev) => ({ ...prev, [key]: message }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = setUserPasswordFormSchema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ password: flat.password?.[0], confirm: flat.confirm?.[0] });
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch(`/api/v1/users/${user.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<unknown>;

      if (!json.success) {
        const details = json.error.details ?? {};
        setErrors({ password: details.password?.[0] });
        if (!details.password?.length) setFormError(json.error.message);
        return;
      }

      onDone();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => !submitting && onClose()}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-password-title"
        className="bg-surface shadow-lift relative grid max-h-full w-full max-w-2xl overflow-x-hidden overflow-y-auto rounded-3xl md:grid-cols-[0.8fr_1fr]"
      >
        <div className="bg-brand-soft relative hidden md:block">
          <Image
            src="/images/set-password.webp"
            alt=""
            fill
            sizes="320px"
            className="object-cover object-center"
          />
          <div className="from-brand/80 absolute inset-0 bg-linear-to-t to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-surface font-display text-lg font-semibold">Set a new password</p>
            <p className="text-surface/80 mt-1 text-xs">
              Share it with them over a trusted channel.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <h2 id="set-password-title" className="font-display text-ink text-xl font-semibold">
            Password for {user.name}
          </h2>
          <p className="text-muted mt-1 text-sm">
            Their current password stops working immediately.
          </p>

          {formError ? (
            <p className="border-coral/30 bg-coral/10 text-coral mt-4 rounded-2xl border px-4 py-3 text-sm">
              {formError}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <AuthField
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min 8 chars, with a letter and a number"
              required
              value={form.password}
              error={errors.password}
              onChange={update("password")}
              onBlur={() => validateField("password")}
            />
            <AuthField
              label="Confirm password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter the password"
              required
              value={form.confirm}
              error={errors.confirm}
              onChange={update("confirm")}
              onBlur={() => validateField("confirm")}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="border-line text-ink hover:bg-cream rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand text-surface rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Save password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
