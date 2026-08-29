"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { Star } from "@/app/_components/Icons";
import { ImageField } from "@/app/admin/_components/ImageField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { EmbeddedMediaDTO } from "@/types/media";
import type { TestimonialDTO } from "@/types/testimonial";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function TestimonialForm({ testimonialId }: { testimonialId?: string }) {
  const router = useRouter();
  const editing = Boolean(testimonialId);

  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState<EmbeddedMediaDTO | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!testimonialId) return;
    let alive = true;
    fetch(`/api/v1/testimonials/${testimonialId}`, { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<TestimonialDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        const t = json.data;
        setAuthorName(t.authorName);
        setRole(t.role);
        setQuote(t.quote);
        setRating(t.rating);
        setImage(t.image);
      })
      .catch(() => {
        if (alive) setLoadError("Could not load this testimonial.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [testimonialId]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (authorName.trim().length < 2) e.authorName = "Enter the person's name";
    if (role.trim().length < 2) e.role = "Enter their role or company";
    if (quote.trim().length < 10) e.quote = "The testimonial is too short";
    if (rating < 1) e.rating = "Pick a rating";
    if (!image) e.image = "Choose a photo";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const body = {
      authorName: authorName.trim(),
      role: role.trim(),
      quote: quote.trim(),
      rating,
      image: image ? { key: image.key } : undefined,
    };

    setSubmitting(true);
    try {
      const res = await fetch(
        editing ? `/api/v1/testimonials/${testimonialId}` : "/api/v1/testimonials",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<TestimonialDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save this testimonial.");
        return;
      }
      router.push("/admin/testimonials");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <p className="border-coral/30 bg-coral/10 text-coral rounded-2xl border px-4 py-3 text-sm">
          {loadError}
        </p>
        <Link
          href="/admin/testimonials"
          className="text-brand mt-4 inline-block text-sm font-semibold hover:underline"
        >
          ← Back to testimonials
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <Link href="/admin/testimonials" className="text-muted hover:text-ink text-sm font-medium">
        ← Testimonials
      </Link>
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {editing ? "Edit testimonial" : "New testimonial"}
      </h1>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 " noValidate>
        <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
          <div className="space-y-6">
            <ImageField
              label="Photo"
              required
              hint="A headshot of the person. A square works best."
              value={image}
              error={errors.image}
              onChange={(m) => setImage(m)}
              aspect="aspect-square"
            />

            <AuthField
              label="Name *"
              name="authorName"
              placeholder="e.g. Priya Sharma"
              value={authorName}
              error={errors.authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />

            <AuthField
              label="Role / company *"
              name="role"
              placeholder="e.g. Product Designer at Acme"
              value={role}
              error={errors.role}
              onChange={(e) => setRole(e.target.value)}
            />

            <div>
              <span className="text-ink text-sm font-medium">
                Rating <span className="text-coral">*</span>
              </span>
              <StarRating value={rating} onChange={setRating} />
              {errors.rating ? <p className="text-coral mt-1.5 text-sm">{errors.rating}</p> : null}
            </div>

            <label className="block">
              <span className="text-ink flex items-center justify-between text-sm font-medium">
                Testimonial <span className="text-coral">*</span>
                <span className="text-muted text-xs font-normal tabular-nums">
                  {quote.trim().length}/600
                </span>
              </span>
              <textarea
                name="quote"
                rows={4}
                maxLength={600}
                placeholder="What did they say about working with you…"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                aria-invalid={errors.quote ? true : undefined}
                className={`mt-2 resize-none ${inputClass} ${
                  errors.quote ? "border-coral focus:border-coral focus:ring-coral/10" : ""
                }`}
              />
              {errors.quote ? (
                <span className="text-coral mt-1.5 block text-sm">{errors.quote}</span>
              ) : null}
            </label>
          </div>
        </section>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/admin/testimonials"
            className="border-line text-ink hover:bg-cream rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-surface shadow-soft rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : editing ? "Save changes" : "Create testimonial"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="mt-2 flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={value === n}
          className={`rounded-lg p-1 transition-colors ${
            n <= value ? "text-amber-400" : "text-line hover:text-amber-300"
          }`}
        >
          <Star className="h-7 w-7" />
        </button>
      ))}
    </div>
  );
}
