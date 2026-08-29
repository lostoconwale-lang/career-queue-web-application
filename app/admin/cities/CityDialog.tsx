"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";

import { AuthField } from "@/app/_components/AuthField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { createCityBodySchema } from "@/lib/validators/city.validator";
import type { ApiResponse } from "@/types/api";
import type { CityDTO } from "@/types/city";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function CityDialog({
  city,
  onClose,
  onSaved,
}: {
  city: CityDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = city !== null;
  const [name, setName] = useState(city?.name ?? "");
  const [metaTitle, setMetaTitle] = useState(city?.seo.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(city?.seo.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState((city?.seo.metaKeywords ?? []).join(", "));
  // Hidden in the form for now — kept so editing a city preserves any existing value.
  const ogImage = city?.seo.ogImage ?? "";

  const [fieldError, setFieldError] = useState<string | undefined>();
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

  function validate() {
    const result = createCityBodySchema.safeParse({ name });
    const message = result.success ? undefined : result.error.flatten().fieldErrors.name?.[0];
    setFieldError(message);
    return result.success;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const seo = {
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      metaKeywords: metaKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      ogImage: ogImage.trim(),
    };

    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/v1/cities/${city.id}` : "/api/v1/cities", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), seo }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<CityDTO>;

      if (!json.success) {
        const details = json.error.details ?? {};
        if (details.name?.length) setFieldError(details.name[0]);
        else setFormError(json.error.message);
        return;
      }

      onSaved();
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
        aria-labelledby="city-dialog-title"
        className="bg-surface shadow-lift relative grid max-h-full w-full max-w-4xl overflow-x-hidden overflow-y-auto rounded-3xl md:grid-cols-[0.9fr_1fr]"
      >
        <div className="bg-brand-soft relative hidden md:block">
          <Image
            src="/images/city-illustration.webp"
            alt=""
            fill
            sizes="320px"
            className="object-cover object-center"
          />
          <div className="from-brand/80 absolute inset-0 bg-linear-to-t to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-surface font-display text-lg font-semibold">
              {editing ? "Edit city" : "Add a city"}
            </p>
            <p className="text-surface/80 mt-1 text-xs">
              Cities power search and location pages across the job board.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <h2 id="city-dialog-title" className="font-display text-ink text-xl font-semibold">
            {editing ? "Edit city" : "New city"}
          </h2>

          {formError ? (
            <p className="border-coral/30 bg-coral/10 text-coral mt-4 rounded-2xl border px-4 py-3 text-sm">
              {formError}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <AuthField
              label="City name"
              name="name"
              placeholder="e.g. Mumbai"
              required
              autoFocus
              value={name}
              error={fieldError}
              onChange={(e) => setName(e.target.value)}
              onBlur={validate}
            />

            <div className="border-line border-t pt-4">
              <p className="text-ink text-sm font-semibold">Search engine listing</p>
              <p className="text-muted mt-0.5 text-xs">
                How this city&apos;s page appears in Google search results.
              </p>
            </div>

            <AuthField
              label="Meta title"
              name="metaTitle"
              placeholder="Jobs in Mumbai | Acme Careers"
              maxLength={70}
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />

            <label className="block">
              <span className="text-ink text-sm font-medium">Meta description</span>
              <textarea
                name="metaDescription"
                rows={3}
                maxLength={160}
                placeholder="Browse the latest openings across Mumbai…"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className={`mt-2 resize-none ${inputClass}`}
              />
              <span className="text-muted mt-1 block text-xs tabular-nums">
                {metaDescription.length}/160
              </span>
            </label>

            <AuthField
              label="Meta keywords"
              name="metaKeywords"
              placeholder="mumbai jobs, careers mumbai, hiring"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
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
                {submitting ? "Saving…" : editing ? "Save" : "Add city"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
