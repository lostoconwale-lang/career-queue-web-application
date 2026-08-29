"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { Close, Expand, Refresh, Trash, UploadCloud } from "@/app/_components/Icons";
import { MediaPicker } from "@/app/admin/media/MediaPicker";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { createCategoryBodySchema } from "@/lib/validators/category.validator";
import type { ApiResponse } from "@/types/api";
import type { CategoryDTO } from "@/types/category";
import type { EmbeddedMediaDTO } from "@/types/media";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function CategoryForm({ categoryId }: { categoryId?: string }) {
  const router = useRouter();
  const editing = Boolean(categoryId);

  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [icon, setIcon] = useState<EmbeddedMediaDTO | null>(null);
  const [iconName, setIconName] = useState("");
  const [picking, setPicking] = useState(false);
  const [viewing, setViewing] = useState(false);

  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!categoryId) return;
    let alive = true;
    fetch(`/api/v1/categories/${categoryId}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CategoryDTO>>;
      })
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        const c = json.data;
        setName(c.name);
        setDescription(c.description);
        setMetaTitle(c.seo.metaTitle);
        setMetaDescription(c.seo.metaDescription);
        setMetaKeywords(c.seo.metaKeywords.join(", "));
        setOgImage(c.seo.ogImage);
        setIcon(c.icon);
        if (c.icon) setIconName(c.icon.key.split("/").pop() ?? "");
      })
      .catch(() => {
        if (alive) setLoadError("Could not load this category.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [categoryId]);

  useEffect(() => {
    if (!viewing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewing(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [viewing]);

  function validate() {
    const result = createCategoryBodySchema.safeParse({ name });
    const message = result.success ? undefined : result.error.flatten().fieldErrors.name?.[0];
    setFieldError(message);
    return result.success;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const body = {
      name: name.trim(),
      description: description.trim(),
      icon: icon ? { key: icon.key } : null,
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaKeywords: metaKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        ogImage: ogImage.trim(),
      },
    };

    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/v1/categories/${categoryId}` : "/api/v1/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<CategoryDTO>;
      if (!json.success) {
        const details = json.error.details ?? {};
        if (details.name?.length) setFieldError(details.name[0]);
        else setFormError(json.error.message);
        return;
      }
      router.push("/admin/categories");
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
          href="/admin/categories"
          className="text-brand mt-4 inline-block text-sm font-semibold hover:underline"
        >
          ← Back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <Link href="/admin/categories" className="text-muted hover:text-ink text-sm font-medium">
        ← Categories
      </Link>
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {editing ? "Edit category" : "New category"}
      </h1>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
            <h2 className="font-display text-ink text-lg font-semibold">Details</h2>
            <p className="text-muted mt-0.5 text-sm">The basics shown across the job board.</p>

            <div className="mt-6 space-y-5">
              <AuthField
                label="Category name"
                name="name"
                placeholder="e.g. Engineering"
                required
                value={name}
                error={fieldError}
                onChange={(e) => setName(e.target.value)}
                onBlur={validate}
              />

              <div>
                <span className="text-ink text-sm font-medium">Icon</span>
                <p className="text-muted mt-0.5 text-xs">
                  A small square image shown next to the category. Best around 128×128.
                </p>

                {icon ? (
                  <div className="border-line mt-2 flex items-center gap-4 rounded-2xl border p-3">
                    <button
                      type="button"
                      onClick={() => setViewing(true)}
                      aria-label="View full icon"
                      className="group bg-cream border-line relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={icon.url} alt="" className="h-full w-full object-contain p-1.5" />
                      <span className="bg-ink/0 group-hover:bg-ink/30 absolute inset-0 grid place-items-center transition-colors">
                        <Expand className="text-surface h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-sm font-medium" title={iconName}>
                        {iconName || "Selected icon"}
                      </p>
                      <p className="text-muted mt-0.5 text-xs">
                        Click the thumbnail to view it full size.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPicking(true)}
                      aria-label="Change icon"
                      title="Change"
                      className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1.5 transition-colors"
                    >
                      <Refresh className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIcon(null);
                        setIconName("");
                      }}
                      aria-label="Remove icon"
                      title="Remove"
                      className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className="border-line text-muted hover:border-brand/50 hover:bg-cream mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors"
                  >
                    <UploadCloud className="h-9 w-9" />
                    <span className="text-ink text-sm font-semibold">Choose an icon</span>
                    <span className="text-xs">Pick one from the media library</span>
                  </button>
                )}
              </div>

              <label className="block">
                <span className="text-ink text-sm font-medium">Description</span>
                <textarea
                  name="description"
                  rows={3}
                  maxLength={500}
                  placeholder="A short summary of the roles in this category…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`mt-2 resize-none ${inputClass}`}
                />
                <span className="text-muted mt-1 block text-xs tabular-nums">
                  {description.length}/500
                </span>
              </label>
            </div>
          </section>

          <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
            <h2 className="font-display text-ink text-lg font-semibold">Search engine listing</h2>
            <p className="text-muted mt-0.5 text-sm">
              How this category&apos;s page appears in Google search results.
            </p>

            <div className="mt-6 space-y-5">
              <AuthField
                label="Meta title"
                name="metaTitle"
                placeholder="Engineering jobs | Acme Careers"
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
                  placeholder="Explore engineering roles hiring right now…"
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
                placeholder="engineering jobs, software careers, developer roles"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
              />
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/admin/categories"
            className="border-line text-ink hover:bg-cream rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-surface shadow-soft rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : editing ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>

      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(media) => {
            setIcon({ id: media.id, key: media.key, url: media.url });
            setIconName(media.originalName);
            setPicking(false);
          }}
        />
      ) : null}

      {viewing && icon ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-10">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setViewing(false)}
            className="bg-ink/80 absolute inset-0"
          />
          <button
            type="button"
            onClick={() => setViewing(false)}
            aria-label="Close"
            className="text-surface/80 hover:text-surface absolute top-4 right-4"
          >
            <Close className="h-7 w-7" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon.url}
            alt={iconName}
            className="relative max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
