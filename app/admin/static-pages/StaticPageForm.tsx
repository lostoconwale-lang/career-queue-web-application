"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { Check } from "@/app/_components/Icons";
import { RichTextEditor } from "@/app/_components/RichTextEditor";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { htmlToText } from "@/lib/sanitize-html";
import type { ApiResponse } from "@/types/api";
import type { StaticPageDTO } from "@/types/static-page";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set([
  "admin",
  "api",
  "login",
  "register",
  "onboarding",
  "pending",
  "no-access",
]);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type TabKey = "content" | "seo";
const TABS: { key: TabKey; label: string }[] = [
  { key: "content", label: "Content" },
  { key: "seo", label: "SEO" },
];
const FIELD_TAB: Record<string, TabKey> = {
  title: "content",
  slug: "content",
  content: "content",
};

export function StaticPageForm({ pageId }: { pageId?: string }) {
  const router = useRouter();
  const editing = Boolean(pageId);

  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("content");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!pageId) return;
    let alive = true;
    fetch(`/api/v1/static-pages/${pageId}`, { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<StaticPageDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        const p = json.data;
        setTitle(p.title);
        setSlug(p.slug);
        setSlugTouched(true);
        setContent(p.content);
        setMetaTitle(p.seo.metaTitle);
        setMetaDescription(p.seo.metaDescription);
        setMetaKeywords(p.seo.metaKeywords.join(", "));
      })
      .catch(() => {
        if (alive) setLoadError("Could not load this page.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pageId]);

  // Fill the slug from the title until the admin edits the slug directly.
  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  const contentLen = htmlToText(content).length;

  const errors = useMemo<Record<string, string>>(() => {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = "Enter the page title (min 3 characters)";
    const s = slug.trim();
    if (!s) e.slug = "Enter a URL slug";
    else if (!SLUG_RE.test(s)) e.slug = "Use lowercase letters, numbers and hyphens only";
    else if (RESERVED.has(s)) e.slug = "That slug is reserved";
    if (contentLen < 20) e.content = `Add some page content — ${contentLen} characters so far`;
    return e;
  }, [title, slug, contentLen]);

  const tabErrorCount = (key: TabKey) =>
    Object.keys(errors).filter((f) => FIELD_TAB[f] === key).length;

  const show = (field: string) => (submitted || touched[field] ? errors[field] : undefined);
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
      slug: slug.trim(),
      content,
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaKeywords: metaKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        ogImage: "",
      },
    };

    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/v1/static-pages/${pageId}` : "/api/v1/static-pages", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<StaticPageDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save this page.");
        return;
      }
      router.push("/admin/static-pages");
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
          href="/admin/static-pages"
          className="text-brand mt-4 inline-block text-sm font-semibold hover:underline"
        >
          ← Back to pages
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <Link href="/admin/static-pages" className="text-muted hover:text-ink text-sm font-medium">
        ← Pages
      </Link>
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {editing ? "Edit page" : "New page"}
      </h1>

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
                {count > 0 ? (
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[11px] tabular-nums ${
                      submitted ? "bg-coral/15 text-coral" : "bg-cream text-muted"
                    }`}
                  >
                    {count}
                  </span>
                ) : (
                  <span className="bg-brand-soft text-brand grid h-5 w-5 place-items-center rounded-full">
                    <Check className="h-3 w-3" />
                  </span>
                )}
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
            <div className="space-y-6">
              <AuthField
                label="Title *"
                name="title"
                placeholder="e.g. Privacy Policy"
                value={title}
                error={show("title")}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={() => markTouched("title")}
              />

              <AuthField
                label="URL slug *"
                name="slug"
                prefix="/"
                placeholder="privacy-policy"
                value={slug}
                error={show("slug")}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                onBlur={() => markTouched("slug")}
              />
              <p className="text-muted -mt-3 text-xs">
                The page will be shown at{" "}
                <span className="text-ink font-medium">/{slug || "…"}</span>.
              </p>

              <div>
                <span className="text-ink text-sm font-medium">
                  Content <span className="text-coral">*</span>
                </span>
                <div className="mt-2">
                  <RichTextEditor
                    value={content}
                    onChange={(html) => {
                      markTouched("content");
                      setContent(html);
                    }}
                    invalid={Boolean(show("content"))}
                    ariaLabel="Page content"
                    placeholder="Write the page content…"
                  />
                </div>
                {show("content") ? (
                  <p className="text-coral mt-1.5 text-sm">{show("content")}</p>
                ) : null}
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
                  How this page appears in Google search results. Optional.
                </p>
              </div>

              <AuthField
                label="Meta title"
                name="metaTitle"
                placeholder="Privacy Policy | Acme Careers"
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
                  placeholder="How Acme collects and uses your personal data…"
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
                placeholder="privacy, data protection, gdpr"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
              />
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
            href="/admin/static-pages"
            className="border-line text-ink hover:bg-cream rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-surface shadow-soft rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : editing ? "Save changes" : "Create page"}
          </button>
        </div>
      </form>
    </div>
  );
}
