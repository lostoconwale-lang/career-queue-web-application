"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "@/app/_components/AuthField";
import HowItWorks from "@/app/_components/HowItWorks";
import { Plus, Trash } from "@/app/_components/Icons";
import { ImageField } from "@/app/admin/_components/ImageField";
import { Switch } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import {
  HOW_IT_WORKS_STEPS_MAX,
  HOW_IT_WORKS_STEPS_MIN,
  type HowItWorksDTO,
} from "@/types/how-it-works";
import type { EmbeddedMediaDTO } from "@/types/media";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

const PREVIEW_BASE_WIDTH = 1440;

type DraftStep = {
  key: string;
  word: string;
  image: EmbeddedMediaDTO | null;
  title: string;
  body: string;
  isActive: boolean;
};

const emptyStep = (): DraftStep => ({
  key: crypto.randomUUID(),
  word: "",
  image: null,
  title: "",
  body: "",
  isActive: true,
});

type TabKey = "content" | "steps";
const TABS: { key: TabKey; label: string }[] = [
  { key: "content", label: "Content" },
  { key: "steps", label: "Steps" },
];

export function HowItWorksForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("content");

  const [eyebrow, setEyebrow] = useState("");
  const [subtext, setSubtext] = useState("");
  const [steps, setSteps] = useState<DraftStep[]>([]);

  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/how-it-works", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<HowItWorksDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        const h = json.data;
        setEyebrow(h.eyebrow);
        setSubtext(h.subtext);
        setSteps(
          h.steps.map((s) => ({
            key: crypto.randomUUID(),
            word: s.word,
            image: s.image,
            title: s.title,
            body: s.body,
            isActive: s.isActive,
          })),
        );
      })
      .catch(() => {
        if (alive) setLoadError("Could not load the how-it-works content.");
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
    if (eyebrow.trim().length < 1) e.eyebrow = "Enter the eyebrow text";
    if (subtext.trim().length < 1) e.subtext = "Enter the supporting text";
    if (steps.length < HOW_IT_WORKS_STEPS_MIN) e.steps = "Add at least one step";
    return e;
  }, [eyebrow, subtext, steps.length]);

  const stepErrors = useMemo(
    () =>
      steps.map((step) => {
        const e: Record<string, string> = {};
        if (!step.word.trim()) e.word = "Enter the step word";
        if (!step.image) e.image = "Choose an image";
        if (!step.title.trim()) e.title = "Enter the step title";
        if (!step.body.trim()) e.body = "Enter the step description";
        return e;
      }),
    [steps],
  );
  const stepsWithErrors = stepErrors.filter((e) => Object.keys(e).length > 0).length;

  function tabErrorCount(key: TabKey) {
    if (key === "content") return Object.keys(errors).filter((f) => f !== "steps").length;
    return (errors.steps ? 1 : 0) + stepsWithErrors;
  }

  function updateStep(key: string, patch: Partial<DraftStep>) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, emptyStep()]);
  }

  function removeStep(key: string) {
    setSteps((prev) => prev.filter((s) => s.key !== key));
  }

  const previewSteps = steps
    .filter((s) => s.isActive && s.image && s.word.trim() && s.title.trim() && s.body.trim())
    .map((s) => ({
      word: s.word,
      imageUrl: s.image?.url ?? "",
      title: s.title,
      body: s.body,
    }));

  const previewContent = { eyebrow, subtext, steps: previewSteps };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    setSubmitted(true);

    if (Object.keys(errors).length > 0 || stepsWithErrors > 0) {
      if (Object.keys(errors).some((f) => f !== "steps")) setTab("content");
      else setTab("steps");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/how-it-works", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eyebrow: eyebrow.trim(),
          subtext: subtext.trim(),
          steps: steps.map((s) => ({
            word: s.word.trim(),
            image: s.image ? { key: s.image.key } : null,
            title: s.title.trim(),
            body: s.body.trim(),
            isActive: s.isActive,
          })),
        }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<HowItWorksDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save the how-it-works content.");
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
  const totalErrorCount = Object.keys(errors).length + stepsWithErrors;

  return (
    <div className="px-5 py-10 sm:px-8">
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        How it works
      </h1>
      <p className="text-muted mt-2 text-sm">
        The steps section shown on the home page, right after the hero.
      </p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      {saved ? (
        <p className="border-brand/30 bg-brand-soft text-brand mt-5 rounded-2xl border px-4 py-3 text-sm">
          How it works saved.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-2" noValidate>
        <div>
          <div className="border-line flex gap-1 border-b">
            {TABS.map((t) => {
              const count = tabErrorCount(t.key);
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    active ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {count > 0 ? (
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[11px] tabular-nums ${
                        submitted ? "bg-coral/15 text-coral" : "bg-cream text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                  {t.label}
                  {active ? (
                    <span className="bg-brand absolute inset-x-0 bottom-0 h-0.5 rounded-full" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <section className="bg-surface border-line shadow-soft mt-5 rounded-2xl border p-6 sm:p-7">
            {tab === "content" ? (
              <div className="grid gap-5">
                <AuthField
                  label="Eyebrow"
                  name="eyebrow"
                  hint="The small label above the headline."
                  maxLength={60}
                  value={eyebrow}
                  error={fieldError("eyebrow")}
                  onChange={(e) => setEyebrow(e.target.value)}
                />
                <label className="block">
                  <span className="text-ink text-sm font-medium">Supporting text</span>
                  <textarea
                    name="subtext"
                    rows={3}
                    maxLength={200}
                    value={subtext}
                    onChange={(e) => setSubtext(e.target.value)}
                    className={`mt-2 resize-none ${inputClass}`}
                  />
                  {fieldError("subtext") ? (
                    <p className="text-coral mt-1.5 text-sm">{fieldError("subtext")}</p>
                  ) : (
                    <span className="text-muted mt-1 block text-xs tabular-nums">
                      {subtext.length}/200
                    </span>
                  )}
                </label>
                <p className="text-muted text-xs">
                  The headline is built automatically from each step&apos;s word (e.g. Search →
                  Match → Apply) — edit it on the Steps tab.
                </p>
              </div>
            ) : null}

            {tab === "steps" ? (
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">Steps</h2>
                <p className="text-muted mt-0.5 text-sm">
                  Between {HOW_IT_WORKS_STEPS_MIN} and {HOW_IT_WORKS_STEPS_MAX} steps. Each
                  step&apos;s word also appears in the headline above.
                </p>
                {submitted && errors.steps ? (
                  <p className="text-coral mt-1.5 text-sm">{errors.steps}</p>
                ) : null}

                <div className="mt-5 grid gap-4">
                  {steps.map((step, index) => {
                    const stepError = submitted ? stepErrors[index] : undefined;
                    return (
                      <div key={step.key} className="border-line rounded-2xl border p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-ink text-sm font-semibold">
                              Step {index + 1}
                            </span>
                            <Switch
                              checked={step.isActive}
                              onChange={(next) => updateStep(step.key, { isActive: next })}
                              label={`Show step ${index + 1} on the home page`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStep(step.key)}
                            aria-label={`Remove step ${index + 1}`}
                            className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <ImageField
                              label="Step image"
                              aspect="aspect-square"
                              contain
                              value={step.image}
                              onChange={(image) => updateStep(step.key, { image })}
                              error={stepError?.image}
                            />
                          </div>
                          <AuthField
                            label="Word"
                            name={`word-${step.key}`}
                            hint="Shown in the headline chain, e.g. Search."
                            maxLength={20}
                            value={step.word}
                            error={stepError?.word}
                            onChange={(e) => updateStep(step.key, { word: e.target.value })}
                          />
                          <AuthField
                            label="Title"
                            name={`title-${step.key}`}
                            maxLength={100}
                            value={step.title}
                            error={stepError?.title}
                            onChange={(e) => updateStep(step.key, { title: e.target.value })}
                          />
                          <label className="block sm:col-span-2">
                            <span className="text-ink text-sm font-medium">Description</span>
                            <textarea
                              rows={2}
                              maxLength={300}
                              value={step.body}
                              onChange={(e) => updateStep(step.key, { body: e.target.value })}
                              className={`mt-2 resize-none ${inputClass}`}
                            />
                            {stepError?.body ? (
                              <p className="text-coral mt-1.5 text-sm">{stepError.body}</p>
                            ) : null}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {steps.length < HOW_IT_WORKS_STEPS_MAX ? (
                  <button
                    type="button"
                    onClick={addStep}
                    className="border-line text-ink hover:bg-cream mt-4 inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add step
                  </button>
                ) : (
                  <p className="text-muted mt-4 text-xs">
                    You&apos;ve reached the limit of {HOW_IT_WORKS_STEPS_MAX} steps.
                  </p>
                )}
              </div>
            ) : null}
          </section>

          <div className="mt-6 flex items-center justify-end gap-3">
            {submitted && totalErrorCount > 0 ? (
              <p className="text-coral mr-auto text-sm">
                {totalErrorCount} field{totalErrorCount > 1 ? "s" : ""} still need attention.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="bg-brand text-surface shadow-soft rounded-full px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save how it works"}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="text-muted text-sm font-medium">Preview</p>
          <HowItWorksPreview content={previewContent} />
        </div>
      </form>
    </div>
  );
}

function HowItWorksPreview({
  content,
}: {
  content: {
    eyebrow: string;
    subtext: string;
    steps: { word: string; imageUrl: string; title: string; body: string }[];
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
        <HowItWorks content={content} />
      </div>
    </div>
  );
}
