"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "@/app/_components/AuthField";
import Hero from "@/app/_components/Hero";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { HeroDTO } from "@/types/hero";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

const PREVIEW_BASE_WIDTH = 1440;

export function HeroForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [badgeText, setBadgeText] = useState("");
  const [headlineLine1, setHeadlineLine1] = useState("");
  const [headlineLine2, setHeadlineLine2] = useState("");
  const [headlineLine3, setHeadlineLine3] = useState("");
  const [headlineHighlight, setHeadlineHighlight] = useState("");
  const [subtext, setSubtext] = useState("");
  const [trustText, setTrustText] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/hero", { cache: "no-store" })
      .then((res) => (redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<HeroDTO>>)))
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        const h = json.data;
        setBadgeText(h.badgeText);
        setHeadlineLine1(h.headlineLine1);
        setHeadlineLine2(h.headlineLine2);
        setHeadlineLine3(h.headlineLine3);
        setHeadlineHighlight(h.headlineHighlight);
        setSubtext(h.subtext);
        setTrustText(h.trustText);
      })
      .catch(() => {
        if (alive) setLoadError("Could not load the hero content.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const errors = useMemo<Record<string, string>>(() => {
    const e: Record<string, string> = {};
    if (badgeText.trim().length < 1) e.badgeText = "Enter the badge text";
    if (headlineLine1.trim().length < 1) e.headlineLine1 = "Enter the first headline line";
    if (headlineLine2.trim().length < 1) e.headlineLine2 = "Enter the second headline line";
    if (headlineLine3.trim().length < 1) e.headlineLine3 = "Enter the third headline line";
    if (headlineHighlight.trim().length < 1) e.headlineHighlight = "Enter the highlighted word";
    if (subtext.trim().length < 1) e.subtext = "Enter the supporting text";
    if (trustText.trim().length < 1) e.trustText = "Enter the trust line";
    return e;
  }, [badgeText, headlineLine1, headlineLine2, headlineLine3, headlineHighlight, subtext, trustText]);

  const previewContent = {
    badgeText,
    headlineLine1,
    headlineLine2,
    headlineLine3,
    headlineHighlight,
    subtext,
    trustText,
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    setSubmitted(true);

    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/v1/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeText: badgeText.trim(),
          headlineLine1: headlineLine1.trim(),
          headlineLine2: headlineLine2.trim(),
          headlineLine3: headlineLine3.trim(),
          headlineHighlight: headlineHighlight.trim(),
          subtext: subtext.trim(),
          trustText: trustText.trim(),
        }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<HeroDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save the hero content.");
        return;
      }
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

  const fieldError = (key: string) => (submitted ? errors[key] : undefined);

  return (
    <div className="px-5 py-10 sm:px-8">
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Hero section
      </h1>
      <p className="text-muted mt-2 text-sm">
        The headline and copy shown at the top of the home page.
      </p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      {saved ? (
        <p className="border-brand/30 bg-brand-soft text-brand mt-5 rounded-2xl border px-4 py-3 text-sm">
          Hero section saved.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-2" noValidate>
        <section className="bg-surface border-line shadow-soft h-fit rounded-2xl border p-6 sm:p-7">
          <div className="grid gap-5">
            <AuthField
              label="Badge text"
              name="badgeText"
              hint="The small pill above the headline. Keep it short."
              maxLength={60}
              value={badgeText}
              error={fieldError("badgeText")}
              onChange={(e) => setBadgeText(e.target.value)}
            />
            <AuthField
              label="Headline — line 1"
              name="headlineLine1"
              hint="Bold, largest line."
              maxLength={40}
              value={headlineLine1}
              error={fieldError("headlineLine1")}
              onChange={(e) => setHeadlineLine1(e.target.value)}
            />
            <AuthField
              label="Headline — line 2"
              name="headlineLine2"
              hint="Shown in italic, in the brand color."
              maxLength={40}
              value={headlineLine2}
              error={fieldError("headlineLine2")}
              onChange={(e) => setHeadlineLine2(e.target.value)}
            />
            <AuthField
              label="Headline — line 3"
              name="headlineLine3"
              hint="Leads into the highlighted word."
              maxLength={40}
              value={headlineLine3}
              error={fieldError("headlineLine3")}
              onChange={(e) => setHeadlineLine3(e.target.value)}
            />
            <AuthField
              label="Highlighted word"
              name="headlineHighlight"
              hint="Gets an underline — one or two words works best."
              maxLength={20}
              value={headlineHighlight}
              error={fieldError("headlineHighlight")}
              onChange={(e) => setHeadlineHighlight(e.target.value)}
            />
            <label className="block">
              <span className="text-ink text-sm font-medium">Supporting text</span>
              <textarea
                name="subtext"
                rows={3}
                maxLength={220}
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                className={`mt-2 resize-none ${inputClass}`}
              />
              {fieldError("subtext") ? (
                <p className="text-coral mt-1.5 text-sm">{fieldError("subtext")}</p>
              ) : (
                <span className="text-muted mt-1 block text-xs tabular-nums">
                  {subtext.length}/220
                </span>
              )}
            </label>
            <AuthField
              label="Trust line"
              name="trustText"
              hint="The small line under the avatars."
              maxLength={80}
              value={trustText}
              error={fieldError("trustText")}
              onChange={(e) => setTrustText(e.target.value)}
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {submitted && Object.keys(errors).length > 0 ? (
              <p className="text-coral mr-auto text-sm">
                {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} still
                need attention.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="bg-brand text-surface shadow-soft rounded-full px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save hero section"}
            </button>
          </div>
        </section>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="text-muted text-sm font-medium">Preview</p>
          <HeroPreview content={previewContent} />
        </div>
      </form>
    </div>
  );
}

function HeroPreview({
  content,
}: {
  content: {
    badgeText: string;
    headlineLine1: string;
    headlineLine2: string;
    headlineLine3: string;
    headlineHighlight: string;
    subtext: string;
    trustText: string;
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
        <Hero content={content} />
      </div>
    </div>
  );
}
