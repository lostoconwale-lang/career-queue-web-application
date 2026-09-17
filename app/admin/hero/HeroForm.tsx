"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "@/app/_components/AuthField";
import Hero from "@/app/_components/Hero";
import { Briefcase, Close, Plus, Refresh, Trash } from "@/app/_components/Icons";
import { ImageField } from "@/app/admin/_components/ImageField";
import { JobPicker } from "@/app/admin/_components/JobPicker";
import { Switch } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import { HERO_JOB_CARDS_LIMIT, HERO_QUICK_FILTERS_LIMIT, type HeroDTO } from "@/types/hero";
import type { EmbeddedMediaDTO } from "@/types/media";
import type { JobDTO } from "@/types/job";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

const PREVIEW_BASE_WIDTH = 1440;

type LinkedJob = { id: string; title: string };

type DraftJobCard = {
  key: string;
  companyName: string;
  logo: EmbeddedMediaDTO | null;
  jobTitle: string;
  tagsText: string;
  salary: string;
  isActive: boolean;
  linkedJob: LinkedJob | null;
};

const emptyCard = (): DraftJobCard => ({
  key: crypto.randomUUID(),
  companyName: "",
  logo: null,
  jobTitle: "",
  tagsText: "",
  salary: "",
  isActive: true,
  linkedJob: null,
});

const splitTags = (input: string) =>
  input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

type TabKey = "content" | "filters" | "cards";
const TABS: { key: TabKey; label: string }[] = [
  { key: "content", label: "Content" },
  { key: "filters", label: "Quick filters" },
  { key: "cards", label: "Job cards" },
];

export function HeroForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("content");

  const [badgeText, setBadgeText] = useState("");
  const [headlineLine1, setHeadlineLine1] = useState("");
  const [headlineLine2, setHeadlineLine2] = useState("");
  const [headlineLine3, setHeadlineLine3] = useState("");
  const [headlineHighlight, setHeadlineHighlight] = useState("");
  const [subtext, setSubtext] = useState("");
  const [trustText, setTrustText] = useState("");

  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [filterDraft, setFilterDraft] = useState("");
  const [filterError, setFilterError] = useState<string | undefined>();

  const [jobCards, setJobCards] = useState<DraftJobCard[]>([]);
  const [pickingJobFor, setPickingJobFor] = useState<string | null>(null);

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
        setQuickFilters(h.quickFilters);
        setJobCards(
          h.jobCards.map((c) => ({
            key: crypto.randomUUID(),
            companyName: c.companyName,
            logo: c.logo,
            jobTitle: c.jobTitle,
            tagsText: c.tags.join(", "),
            salary: c.salary,
            isActive: c.isActive,
            linkedJob: c.linkedJob,
          })),
        );
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
    if (quickFilters.length < 1) e.quickFilters = "Add at least one quick filter";
    return e;
  }, [
    badgeText,
    headlineLine1,
    headlineLine2,
    headlineLine3,
    headlineHighlight,
    subtext,
    trustText,
    quickFilters,
  ]);

  const cardErrors = useMemo(
    () =>
      jobCards.map((card) => {
        const e: Record<string, string> = {};
        if (!card.companyName.trim()) e.companyName = "Enter the company name";
        if (!card.logo) e.logo = "Choose a logo";
        if (!card.jobTitle.trim()) e.jobTitle = "Enter the job title";
        if (splitTags(card.tagsText).length > 3) e.tags = "At most 3 tags";
        return e;
      }),
    [jobCards],
  );
  const cardsWithErrors = cardErrors.filter((e) => Object.keys(e).length > 0).length;

  function tabErrorCount(key: TabKey) {
    if (key === "content") {
      return Object.keys(errors).filter((f) => f !== "quickFilters").length;
    }
    if (key === "filters") return errors.quickFilters ? 1 : 0;
    return cardsWithErrors;
  }

  function addFilter() {
    const value = filterDraft.trim();
    if (!value) return;
    if (quickFilters.includes(value)) {
      setFilterError("That quick filter already exists");
      return;
    }
    if (quickFilters.length >= HERO_QUICK_FILTERS_LIMIT) {
      setFilterError(`At most ${HERO_QUICK_FILTERS_LIMIT} quick filters`);
      return;
    }
    setFilterError(undefined);
    setQuickFilters((prev) => [...prev, value]);
    setFilterDraft("");
  }

  function removeFilter(value: string) {
    setQuickFilters((prev) => prev.filter((f) => f !== value));
  }

  function updateCard(key: string, patch: Partial<DraftJobCard>) {
    setJobCards((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  function addCard() {
    setJobCards((prev) => [...prev, emptyCard()]);
  }

  function removeCard(key: string) {
    setJobCards((prev) => prev.filter((c) => c.key !== key));
  }

  const previewJobCards = jobCards
    .filter((c) => c.isActive && c.logo && c.companyName.trim() && c.jobTitle.trim())
    .map((c) => ({
      companyName: c.companyName,
      logoUrl: c.logo?.url ?? "",
      jobTitle: c.jobTitle,
      tags: splitTags(c.tagsText),
      salary: c.salary,
      jobId: c.linkedJob?.id ?? null,
    }));

  const previewContent = {
    badgeText,
    headlineLine1,
    headlineLine2,
    headlineLine3,
    headlineHighlight,
    subtext,
    trustText,
    quickFilters,
    jobCards: previewJobCards,
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    setSubmitted(true);

    if (Object.keys(errors).length > 0 || cardsWithErrors > 0) {
      if (Object.keys(errors).some((f) => f !== "quickFilters")) setTab("content");
      else if (errors.quickFilters) setTab("filters");
      else setTab("cards");
      return;
    }

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
          quickFilters,
          jobCards: jobCards.map((c) => ({
            companyName: c.companyName.trim(),
            logo: c.logo ? { key: c.logo.key } : null,
            jobTitle: c.jobTitle.trim(),
            tags: splitTags(c.tagsText),
            salary: c.salary.trim(),
            isActive: c.isActive,
            jobId: c.linkedJob?.id ?? null,
          })),
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
  const totalErrorCount = Object.keys(errors).length + cardsWithErrors;

  return (
    <div className="px-5 py-10 sm:px-8">
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Hero section
      </h1>
      <p className="text-muted mt-2 text-sm">
        The headline, quick filters and job card mockups shown at the top of the home page.
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
            ) : null}

            {tab === "filters" ? (
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">Quick filters</h2>
                <p className="text-muted mt-0.5 text-sm">
                  The tag buttons shown under the search bar. Up to {HERO_QUICK_FILTERS_LIMIT}.
                </p>

                <div className="mt-5 flex max-w-xl gap-2">
                  <input
                    value={filterDraft}
                    placeholder="e.g. Remote"
                    maxLength={24}
                    onChange={(e) => {
                      setFilterDraft(e.target.value);
                      setFilterError(undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addFilter();
                      }
                    }}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addFilter}
                    className="bg-brand text-surface inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-4 text-sm font-semibold transition-opacity hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
                {filterError ? <p className="text-coral mt-1.5 text-sm">{filterError}</p> : null}
                {submitted && fieldError("quickFilters") ? (
                  <p className="text-coral mt-1.5 text-sm">{fieldError("quickFilters")}</p>
                ) : null}

                {quickFilters.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {quickFilters.map((filter) => (
                      <li
                        key={filter}
                        className="bg-cream text-ink inline-flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3 text-sm font-medium"
                      >
                        {filter}
                        <button
                          type="button"
                          onClick={() => removeFilter(filter)}
                          aria-label={`Remove ${filter}`}
                          className="text-muted hover:bg-surface hover:text-coral grid h-5 w-5 place-items-center rounded-full transition-colors"
                        >
                          <Close className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mt-3 text-xs">No quick filters added yet.</p>
                )}
              </div>
            ) : null}

            {tab === "cards" ? (
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">Job card mockups</h2>
                <p className="text-muted mt-0.5 text-sm">
                  The floating cards on the home page. Up to {HERO_JOB_CARDS_LIMIT} — turn one off to
                  hide it without losing its details.
                </p>

                <div className="mt-5 grid gap-4">
                  {jobCards.map((card, index) => {
                    const cardError = submitted ? cardErrors[index] : undefined;
                    return (
                      <div key={card.key} className="border-line rounded-2xl border p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-ink text-sm font-semibold">Card {index + 1}</span>
                            <Switch
                              checked={card.isActive}
                              onChange={(next) => updateCard(card.key, { isActive: next })}
                              label={`Show card ${index + 1} on the home page`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCard(card.key)}
                            aria-label={`Remove card ${index + 1}`}
                            className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <ImageField
                              label="Company logo"
                              aspect="aspect-square"
                              contain
                              value={card.logo}
                              onChange={(logo) => updateCard(card.key, { logo })}
                              error={cardError?.logo}
                            />
                          </div>
                          <AuthField
                            label="Company name"
                            name={`companyName-${card.key}`}
                            maxLength={60}
                            value={card.companyName}
                            error={cardError?.companyName}
                            onChange={(e) => updateCard(card.key, { companyName: e.target.value })}
                          />
                          <AuthField
                            label="Job title"
                            name={`jobTitle-${card.key}`}
                            maxLength={80}
                            value={card.jobTitle}
                            error={cardError?.jobTitle}
                            onChange={(e) => updateCard(card.key, { jobTitle: e.target.value })}
                          />
                          <AuthField
                            label="Tags"
                            name={`tags-${card.key}`}
                            hint="Comma-separated, up to 3 — e.g. Remote, Full-time"
                            value={card.tagsText}
                            error={cardError?.tags}
                            onChange={(e) => updateCard(card.key, { tagsText: e.target.value })}
                          />
                          <AuthField
                            label="Salary (optional)"
                            name={`salary-${card.key}`}
                            hint="Leave blank to hide the salary line."
                            maxLength={40}
                            placeholder="$120k – $150k"
                            value={card.salary}
                            onChange={(e) => updateCard(card.key, { salary: e.target.value })}
                          />

                          <div className="sm:col-span-2">
                            <span className="text-ink text-sm font-medium">
                              Redirect to a job (optional)
                            </span>
                            <p className="text-muted mt-0.5 text-xs">
                              Makes the whole card clickable, taking visitors to that job.
                            </p>
                            {card.linkedJob ? (
                              <div className="border-line mt-2 flex items-center gap-3 rounded-2xl border p-3">
                                <span className="border-line bg-cream text-brand grid h-9 w-9 shrink-0 place-items-center rounded-lg border">
                                  <Briefcase className="h-4 w-4" />
                                </span>
                                <p className="text-ink min-w-0 flex-1 truncate text-sm font-medium">
                                  {card.linkedJob.title}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setPickingJobFor(card.key)}
                                  aria-label="Change linked job"
                                  title="Change"
                                  className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1.5 transition-colors"
                                >
                                  <Refresh className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateCard(card.key, { linkedJob: null })}
                                  aria-label="Remove linked job"
                                  title="Remove"
                                  className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPickingJobFor(card.key)}
                                className="border-line text-muted hover:border-brand/50 hover:bg-cream mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-semibold transition-colors"
                              >
                                <Briefcase className="h-4 w-4" /> Choose a job
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {jobCards.length < HERO_JOB_CARDS_LIMIT ? (
                  <button
                    type="button"
                    onClick={addCard}
                    className="border-line text-ink hover:bg-cream mt-4 inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add job card
                  </button>
                ) : (
                  <p className="text-muted mt-4 text-xs">
                    You&apos;ve reached the limit of {HERO_JOB_CARDS_LIMIT} job cards.
                  </p>
                )}

                {pickingJobFor ? (
                  <JobPicker
                    onClose={() => setPickingJobFor(null)}
                    onPick={(job: JobDTO) => {
                      updateCard(pickingJobFor, { linkedJob: { id: job.id, title: job.title } });
                      setPickingJobFor(null);
                    }}
                  />
                ) : null}
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
              {saving ? "Saving…" : "Save hero section"}
            </button>
          </div>
        </div>

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
    quickFilters: string[];
    jobCards: {
      companyName: string;
      logoUrl: string;
      jobTitle: string;
      tags: string[];
      salary: string;
      jobId: string | null;
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
