"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { Check } from "@/app/_components/Icons";
import { RichTextEditor } from "@/app/_components/RichTextEditor";
import { ChipMultiSelect } from "@/app/admin/_components/ChipMultiSelect";
import { ImageField } from "@/app/admin/_components/ImageField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { JOB_LIMITS as L, parseKeywords } from "@/lib/job.constants";
import { htmlToText } from "@/lib/sanitize-html";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { CategoryDTO } from "@/types/category";
import type { JobTypeDTO } from "@/types/job-type";
import type { EmbeddedMediaDTO } from "@/types/media";
import type { JobCategoryRef, JobDTO, JobTypeRef } from "@/types/job";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

type TabKey = "details" | "description" | "seo";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "description", label: "Description" },
  { key: "seo", label: "SEO" },
];

// Which tab each validated field lives on — used to route errors to a tab.
const FIELD_TAB: Record<string, TabKey> = {
  title: "details",
  categories: "details",
  jobTypes: "details",
  coverImage: "details",
  thumbnail: "details",
  description: "description",
  metaTitle: "seo",
  metaDescription: "seo",
  metaKeywords: "seo",
};

export function JobForm({ jobId }: { jobId?: string }) {
  const router = useRouter();
  const editing = Boolean(jobId);

  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("details");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<JobCategoryRef[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeRef[]>([]);
  const [coverImage, setCoverImage] = useState<EmbeddedMediaDTO | null>(null);
  const [thumbnail, setThumbnail] = useState<EmbeddedMediaDTO | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([]);
  const [allJobTypes, setAllJobTypes] = useState<JobTypeDTO[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Active categories + job types for the pickers.
  useEffect(() => {
    fetch("/api/v1/categories?isActive=true&limit=100", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res)
          ? null
          : (res.json() as Promise<ApiResponse<CursorPage<CategoryDTO>>>),
      )
      .then((json) => {
        if (json?.success) setAllCategories(json.data.items);
      })
      .catch(() => {});

    fetch("/api/v1/job-types?isActive=true&limit=100", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<CursorPage<JobTypeDTO>>>),
      )
      .then((json) => {
        if (json?.success) setAllJobTypes(json.data.items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    fetch(`/api/v1/jobs/${jobId}`, { cache: "no-store" })
      .then((res) => (redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<JobDTO>>)))
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        const j = json.data;
        setTitle(j.title);
        setDescription(j.description);
        setCategories(j.categories);
        setJobTypes(j.jobTypes);
        setCoverImage(j.coverImage);
        setThumbnail(j.thumbnail);
        setMetaTitle(j.seo.metaTitle);
        setMetaDescription(j.seo.metaDescription);
        setMetaKeywords(j.seo.metaKeywords.join(", "));
      })
      .catch(() => {
        if (alive) setLoadError("Could not load this job.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [jobId]);

  const descLen = htmlToText(description).length;
  const keywords = parseKeywords(metaKeywords);
  const titleLen = title.trim().length;
  const metaTitleLen = metaTitle.trim().length;
  const metaDescLen = metaDescription.trim().length;

  // Full field-by-field validation, derived from current state.
  const errors = useMemo<Record<string, string>>(() => {
    const e: Record<string, string> = {};
    if (titleLen < L.title.min) e.title = `Enter at least ${L.title.min} characters`;
    else if (titleLen > L.title.max) e.title = `Keep the title under ${L.title.max} characters`;

    if (descLen < L.description.min)
      e.description = `Write at least ${L.description.min} characters — ${descLen} so far`;
    else if (descLen > L.description.max) e.description = "Description is too long";

    if (categories.length < L.categories.min) e.categories = "Pick at least one category";
    else if (categories.length > L.categories.max)
      e.categories = `Pick at most ${L.categories.max} categories`;

    if (jobTypes.length < L.jobTypes.min) e.jobTypes = "Pick at least one job type";
    else if (jobTypes.length > L.jobTypes.max)
      e.jobTypes = `Pick at most ${L.jobTypes.max} job types`;

    if (!coverImage) e.coverImage = "Choose a cover image";
    if (!thumbnail) e.thumbnail = "Choose a thumbnail";

    if (metaTitleLen < L.metaTitle.min)
      e.metaTitle = `Enter at least ${L.metaTitle.min} characters`;
    else if (metaTitleLen > L.metaTitle.max)
      e.metaTitle = `Keep under ${L.metaTitle.max} characters`;

    if (metaDescLen < L.metaDescription.min)
      e.metaDescription = `Enter at least ${L.metaDescription.min} characters`;
    else if (metaDescLen > L.metaDescription.max)
      e.metaDescription = `Keep under ${L.metaDescription.max} characters`;

    if (keywords.length < L.metaKeywords.min)
      e.metaKeywords = `Add at least ${L.metaKeywords.min} keywords`;
    else if (keywords.length > L.metaKeywords.max)
      e.metaKeywords = `Use at most ${L.metaKeywords.max} keywords`;

    return e;
  }, [
    titleLen,
    descLen,
    categories.length,
    jobTypes.length,
    coverImage,
    thumbnail,
    metaTitleLen,
    metaDescLen,
    keywords.length,
  ]);

  function tabErrorCount(key: TabKey): number {
    return Object.keys(errors).filter((f) => FIELD_TAB[f] === key).length;
  }

  function show(field: string): string | undefined {
    return submitted || touched[field] ? errors[field] : undefined;
  }
  const markTouched = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      const bad = TABS.find((t) => tabErrorCount(t.key) > 0);
      if (bad) setTab(bad.key);
      return;
    }

    const body = {
      title: title.trim(),
      description,
      categoryIds: categories.map((c) => c.id),
      jobTypeIds: jobTypes.map((t) => t.id),
      coverImage: coverImage ? { key: coverImage.key } : null,
      thumbnail: thumbnail ? { key: thumbnail.key } : null,
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaKeywords: keywords,
        ogImage: "",
      },
    };

    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/v1/jobs/${jobId}` : "/api/v1/jobs", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<JobDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save this job.");
        return;
      }
      router.push("/admin/jobs");
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
          href="/admin/jobs"
          className="text-brand mt-4 inline-block text-sm font-semibold hover:underline"
        >
          ← Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <Link href="/admin/jobs" className="text-muted hover:text-ink text-sm font-medium">
        ← Jobs
      </Link>
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {editing ? "Edit job" : "New job"}
      </h1>
      <p className="text-muted mt-2 text-sm">
        All fields are required. Each tab shows how many still need attention.
      </p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6" noValidate>
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
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[11px] tabular-nums ${
                    count === 0
                      ? "bg-brand-soft text-brand"
                      : submitted
                        ? "bg-coral/15 text-coral"
                        : "bg-cream text-muted"
                  }`}
                >
                  {count === 0 ? <Check className="h-3 w-3" /> : count}
                </span>
                {t.label}
                {active ? (
                  <span className="bg-brand absolute inset-x-0 bottom-0 h-0.5 rounded-full" />
                ) : null}
              </button>
            );
          })}
        </div>

        <section className="bg-surface border-line shadow-soft mt-5 rounded-2xl border p-6 sm:p-7">
          {tab === "details" ? (
            <div className="space-y-6">
              <AuthField
                label="Job title *"
                name="title"
                placeholder="e.g. Senior Frontend Engineer"
                value={title}
                error={show("title")}
                trailing={<Meter len={titleLen} min={L.title.min} max={L.title.max} />}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => markTouched("title")}
              />

              <ChipMultiSelect
                label="Categories"
                hint={`Pick ${L.categories.min}–${L.categories.max}. Only active categories are shown.`}
                options={allCategories.map((c) => ({ id: c.id, name: c.name }))}
                value={categories}
                onChange={(next) => {
                  markTouched("categories");
                  setCategories(next);
                }}
                max={L.categories.max}
                error={show("categories")}
                emptyText="No active categories yet."
                emptyHref="/admin/categories/new"
                emptyLinkLabel="Create one"
              />

              <ChipMultiSelect
                label="Job types"
                hint={`Pick ${L.jobTypes.min}–${L.jobTypes.max}. e.g. Full time, Remote, Contract.`}
                options={allJobTypes.map((t) => ({ id: t.id, name: t.name }))}
                value={jobTypes}
                onChange={(next) => {
                  markTouched("jobTypes");
                  setJobTypes(next);
                }}
                max={L.jobTypes.max}
                error={show("jobTypes")}
                emptyText="No active job types yet."
                emptyHref="/admin/job-types/new"
                emptyLinkLabel="Create one"
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <ImageField
                  label="Cover image"
                  required
                  hint="The wide banner on the job page. Around 1600×900."
                  value={coverImage}
                  error={show("coverImage")}
                  onChange={(m) => {
                    markTouched("coverImage");
                    setCoverImage(m);
                  }}
                  aspect="aspect-video"
                />
                <ImageField
                  label="Thumbnail"
                  required
                  hint="The small image in job listings. A square works best."
                  value={thumbnail}
                  error={show("thumbnail")}
                  onChange={(m) => {
                    markTouched("thumbnail");
                    setThumbnail(m);
                  }}
                  aspect="aspect-square"
                />
              </div>
            </div>
          ) : null}

          {tab === "description" ? (
            <div>
              <h2 className="font-display text-ink text-lg font-semibold">
                Job description <span className="text-coral">*</span>
              </h2>
              <p className="text-muted mt-0.5 text-sm">
                The full role description shown on the job page. Formatting is saved as HTML.
                Minimum {L.description.min} characters.
              </p>
              <div className="mt-4">
                <RichTextEditor
                  value={description}
                  onChange={(html) => {
                    markTouched("description");
                    setDescription(html);
                  }}
                  invalid={Boolean(show("description"))}
                  ariaLabel="Job description"
                  placeholder="Describe the role, responsibilities, requirements…"
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-coral text-sm">{show("description") ?? ""}</span>
                <Meter len={descLen} min={L.description.min} />
              </div>
            </div>
          ) : null}

          {tab === "seo" ? (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">
                  Search engine listing
                </h2>
                <p className="text-muted mt-0.5 text-sm">
                  How this job&apos;s page appears in Google search results.
                </p>
              </div>

              <AuthField
                label="Meta title *"
                name="metaTitle"
                placeholder="Senior Frontend Engineer | Acme Careers"
                value={metaTitle}
                error={show("metaTitle")}
                trailing={<Meter len={metaTitleLen} min={L.metaTitle.min} max={L.metaTitle.max} />}
                onChange={(e) => setMetaTitle(e.target.value)}
                onBlur={() => markTouched("metaTitle")}
              />

              <label className="block">
                <span className="text-ink flex items-center justify-between text-sm font-medium">
                  Meta description <span className="text-coral">*</span>
                  <Meter
                    len={metaDescLen}
                    min={L.metaDescription.min}
                    max={L.metaDescription.max}
                  />
                </span>
                <textarea
                  name="metaDescription"
                  rows={3}
                  placeholder="Join Acme as a Senior Frontend Engineer…"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  onBlur={() => markTouched("metaDescription")}
                  aria-invalid={show("metaDescription") ? true : undefined}
                  className={`mt-2 resize-none ${inputClass} ${
                    show("metaDescription")
                      ? "border-coral focus:border-coral focus:ring-coral/10"
                      : ""
                  }`}
                />
                {show("metaDescription") ? (
                  <span className="text-coral mt-1.5 block text-sm">{show("metaDescription")}</span>
                ) : null}
              </label>

              <AuthField
                label="Meta keywords *"
                name="metaKeywords"
                placeholder="frontend jobs, react developer, remote"
                value={metaKeywords}
                error={show("metaKeywords")}
                trailing={
                  <span
                    className={`text-xs font-normal tabular-nums ${
                      keywords.length < L.metaKeywords.min ? "text-coral" : "text-muted"
                    }`}
                  >
                    {keywords.length} · min {L.metaKeywords.min}
                  </span>
                }
                onChange={(e) => setMetaKeywords(e.target.value)}
                onBlur={() => markTouched("metaKeywords")}
              />
              <p className="text-muted -mt-3 text-xs">Separate keywords with commas.</p>
            </div>
          ) : null}
        </section>

        <div className="mt-6 flex items-center justify-end gap-3">
          {submitted && Object.keys(errors).length > 0 ? (
            <p className="text-coral mr-auto text-sm">
              {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} still
              need attention.
            </p>
          ) : null}
          <Link
            href="/admin/jobs"
            className="border-line text-ink hover:bg-cream rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-surface shadow-soft rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : editing ? "Save changes" : "Create job"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Meter({ len, min, max }: { len: number; min: number; max?: number }) {
  const bad = len < min || (max !== undefined && len > max);
  return (
    <span className={`text-xs font-normal tabular-nums ${bad ? "text-coral" : "text-muted"}`}>
      {max !== undefined ? `${len}/${max}` : len} · min {min}
    </span>
  );
}
