"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "@/app/_components/AuthField";
import Testimonials from "@/app/_components/Testimonials";
import { Chevron, Quote, Trash } from "@/app/_components/Icons";
import { TestimonialPicker } from "@/app/admin/_components/TestimonialPicker";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { TestimonialDTO } from "@/types/testimonial";
import {
  TESTIMONIALS_SECTION_LIMIT,
  type TestimonialRef,
  type TestimonialsSectionDTO,
} from "@/types/testimonials-section";

const PREVIEW_BASE_WIDTH = 1440;

export function TestimonialsSectionForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [heading, setHeading] = useState("");
  const [testimonials, setTestimonials] = useState<TestimonialRef[]>([]);
  const [picking, setPicking] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/testimonials-section", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res)
          ? null
          : (res.json() as Promise<ApiResponse<TestimonialsSectionDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        setHeading(json.data.heading);
        setTestimonials(json.data.testimonials);
      })
      .catch(() => {
        if (alive) setLoadError("Could not load the testimonials section.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function addTestimonial(testimonial: TestimonialDTO) {
    setTestimonials((prev) => [
      ...prev,
      {
        id: testimonial.id,
        authorName: testimonial.authorName,
        role: testimonial.role,
        quote: testimonial.quote,
        image: testimonial.image,
      },
    ]);
    setPicking(false);
  }

  function removeTestimonial(id: string) {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
  }

  function moveTestimonial(index: number, direction: -1 | 1) {
    setTestimonials((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const a = prev[index];
      const b = prev[target];
      if (!a || !b) return prev;
      const next = [...prev];
      next[index] = b;
      next[target] = a;
      return next;
    });
  }

  const headingError = submitted && heading.trim().length < 1 ? "Enter the heading" : undefined;

  const previewContent = {
    heading,
    testimonials: testimonials.map((t) => ({
      id: t.id,
      authorName: t.authorName,
      role: t.role,
      quote: t.quote,
      imageUrl: t.image.url,
    })),
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    setSubmitted(true);

    if (heading.trim().length < 1) return;

    setSaving(true);
    try {
      const res = await fetch("/api/v1/testimonials-section", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: heading.trim(),
          testimonialIds: testimonials.map((t) => t.id),
        }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<TestimonialsSectionDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save the testimonials section.");
        return;
      }
      setHeading(json.data.heading);
      setTestimonials(json.data.testimonials);
      setSaved(true);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
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
      </div>
    );
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Testimonials section
      </h1>
      <p className="text-muted mt-2 text-sm">
        Choose which testimonials show on the home page, and in what order. Add or edit the
        testimonials themselves under &quot;Testimonials&quot;.
      </p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      {saved ? (
        <p className="border-brand/30 bg-brand-soft text-brand mt-5 rounded-2xl border px-4 py-3 text-sm">
          Testimonials section saved.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
            <AuthField
              label="Heading"
              name="heading"
              hint="The heading above the testimonials."
              maxLength={100}
              value={heading}
              error={headingError}
              onChange={(e) => setHeading(e.target.value)}
            />
          </section>

          <section className="bg-surface border-line shadow-soft mt-6 rounded-2xl border p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">
                  Featured testimonials
                </h2>
                <p className="text-muted mt-0.5 text-sm">
                  Up to {TESTIMONIALS_SECTION_LIMIT}, in this order.
                </p>
              </div>
            </div>

            {testimonials.length > 0 ? (
              <ul className="mt-5 grid gap-2">
                {testimonials.map((testimonial, index) => (
                  <li
                    key={testimonial.id}
                    className="border-line flex items-center gap-3 rounded-2xl border p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={testimonial.image.url}
                      alt=""
                      className="border-line bg-cream h-9 w-9 shrink-0 rounded-full border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-sm font-medium">
                        {testimonial.authorName}
                      </p>
                      <p className="text-muted truncate text-xs">{testimonial.role}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveTestimonial(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${testimonial.authorName} up`}
                      title="Move up"
                      className="text-muted hover:bg-surface hover:text-ink rounded-lg p-1.5 transition-colors disabled:opacity-30"
                    >
                      <Chevron className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTestimonial(index, 1)}
                      disabled={index === testimonials.length - 1}
                      aria-label={`Move ${testimonial.authorName} down`}
                      title="Move down"
                      className="text-muted hover:bg-surface hover:text-ink rounded-lg p-1.5 transition-colors disabled:opacity-30"
                    >
                      <Chevron className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTestimonial(testimonial.id)}
                      aria-label={`Remove ${testimonial.authorName}`}
                      title="Remove"
                      className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-5 text-xs">No testimonials featured yet.</p>
            )}

            {testimonials.length < TESTIMONIALS_SECTION_LIMIT ? (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="border-line text-ink hover:bg-cream mt-4 inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                <Quote className="h-4 w-4" /> Add a testimonial
              </button>
            ) : (
              <p className="text-muted mt-4 text-xs">
                You&apos;ve reached the limit of {TESTIMONIALS_SECTION_LIMIT} testimonials.
              </p>
            )}
          </section>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand text-surface shadow-soft rounded-full px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save testimonials section"}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="text-muted text-sm font-medium">Preview</p>
          <TestimonialsSectionPreview content={previewContent} />
        </div>
      </form>

      {picking ? (
        <TestimonialPicker
          excludeIds={testimonials.map((t) => t.id)}
          onClose={() => setPicking(false)}
          onPick={addTestimonial}
        />
      ) : null}
    </div>
  );
}

function TestimonialsSectionPreview({
  content,
}: {
  content: {
    heading: string;
    testimonials: {
      id: string;
      authorName: string;
      role: string;
      quote: string;
      imageUrl: string;
    }[];
  };
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const nextScale = outer.clientWidth / PREVIEW_BASE_WIDTH;
      setScale(nextScale);
      setHeight(inner.scrollHeight * nextScale);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [content]);

  if (content.testimonials.length === 0) {
    return (
      <div className="border-line bg-cream text-muted mt-2 grid h-40 place-items-center rounded-2xl border text-sm">
        Nothing to preview yet — add a testimonial.
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      className="border-line bg-cream mt-2 overflow-hidden rounded-2xl border"
      style={{ height }}
    >
      <div
        ref={innerRef}
        className="pointer-events-none"
        style={{ width: PREVIEW_BASE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <Testimonials content={content} />
      </div>
    </div>
  );
}
