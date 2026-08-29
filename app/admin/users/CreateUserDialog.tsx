"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Image from "next/image";

import { AuthField } from "@/app/_components/AuthField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { createUserFormSchema } from "@/lib/validators/user.validator";
import type { ApiResponse } from "@/types/api";
import type { UserDTO } from "@/types/user";

type FieldKey = "name" | "email" | "mobile" | "password";

const initial = { name: "", email: "", mobile: "", password: "" };

export function CreateUserDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: UserDTO) => void;
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
    const result = createUserFormSchema.safeParse(form);
    const message = result.success ? undefined : result.error.flatten().fieldErrors[key]?.[0];
    setErrors((prev) => ({ ...prev, [key]: message }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = createUserFormSchema.safeParse(form);
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
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<UserDTO>;

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

      onCreated(json.data);
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
        aria-labelledby="create-user-title"
        className="bg-surface shadow-lift relative grid max-h-full w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-3xl md:grid-cols-[0.8fr_1fr]"
      >
        <div className="bg-brand-soft relative hidden md:block">
          <Image
            src="/images/auth-register.png"
            alt=""
            fill
            sizes="320px"
            className="object-cover object-center"
          />
          <div className="from-brand/80 absolute inset-0 bg-linear-to-t to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-surface font-display text-lg font-semibold">Add a member</p>
            <p className="text-surface/80 mt-1 text-xs">
              They can sign in right away with the password you set.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <h2 id="create-user-title" className="font-display text-ink text-xl font-semibold">
            New user
          </h2>
     
          {formError ? (
            <p className="border-coral/30 bg-coral/10 text-coral mt-4 rounded-2xl border px-4 py-3 text-sm">
              {formError}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <AuthField
              label="Full name"
              name="name"
              autoComplete="off"
              placeholder="First Last"
              required
              value={form.name}
              error={errors.name}
              onChange={update("name")}
              onBlur={() => validateField("name")}
            />
            <AuthField
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="name@example.com"
              required
              value={form.email}
              error={errors.email}
              onChange={update("email")}
              onBlur={() => validateField("email")}
            />
            <AuthField
              label="Mobile number"
              name="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              prefix="+91"
              placeholder="98765 43210"
              required
              value={form.mobile}
              error={errors.mobile}
              onChange={update("mobile")}
              onBlur={() => validateField("mobile")}
            />
            <AuthField
              label="Password"
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
                {submitting ? "Creating…" : "Create user"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
