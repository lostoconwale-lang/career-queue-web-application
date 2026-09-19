"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import JobCategories from "@/app/_components/JobCategories";
import { Chevron, Tag, Trash } from "@/app/_components/Icons";
import { CategoryPicker } from "@/app/admin/_components/CategoryPicker";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { CategoryDTO } from "@/types/category";
import {
  POPULAR_CATEGORIES_LIMIT,
  type PopularCategoriesDTO,
  type PopularCategoryRef,
} from "@/types/popular-categories";

const PREVIEW_BASE_WIDTH = 1440;

export function PopularCategoriesForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [categories, setCategories] = useState<PopularCategoryRef[]>([]);
  const [picking, setPicking] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/popular-categories", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<PopularCategoriesDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        setCategories(json.data.categories);
      })
      .catch(() => {
        if (alive) setLoadError("Could not load the popular categories.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function addCategory(category: CategoryDTO) {
    setCategories((prev) => [
      ...prev,
      { id: category.id, name: category.name, icon: category.icon },
    ]);
    setPicking(false);
  }

  function removeCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function moveCategory(index: number, direction: -1 | 1) {
    setCategories((prev) => {
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

  const previewCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    iconUrl: c.icon?.url ?? null,
    openRoles: 0,
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    setSaving(true);
    try {
      const res = await fetch("/api/v1/popular-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: categories.map((c) => c.id) }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<PopularCategoriesDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save the popular categories.");
        return;
      }
      setCategories(json.data.categories);
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
        Popular categories
      </h1>
      <p className="text-muted mt-2 text-sm">
        Choose which categories show in the &quot;Popular job categories&quot; section on the home
        page, and in what order.
      </p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      {saved ? (
        <p className="border-brand/30 bg-brand-soft text-brand mt-5 rounded-2xl border px-4 py-3 text-sm">
          Popular categories saved.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">
                  Featured categories
                </h2>
                <p className="text-muted mt-0.5 text-sm">
                  Up to {POPULAR_CATEGORIES_LIMIT}. Open-role counts update automatically — you
                  only choose which categories appear and in what order.
                </p>
              </div>
            </div>

            {categories.length > 0 ? (
              <ul className="mt-5 grid gap-2">
                {categories.map((category, index) => (
                  <li
                    key={category.id}
                    className="border-line flex items-center gap-3 rounded-2xl border p-3"
                  >
                    {category.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.icon.url}
                        alt=""
                        className="border-line bg-cream h-9 w-9 shrink-0 rounded-lg border object-contain p-0.5"
                      />
                    ) : (
                      <span className="border-line bg-cream text-muted grid h-9 w-9 shrink-0 place-items-center rounded-lg border">
                        <Tag className="h-4 w-4" />
                      </span>
                    )}
                    <p className="text-ink min-w-0 flex-1 truncate text-sm font-medium">
                      {category.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => moveCategory(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${category.name} up`}
                      title="Move up"
                      className="text-muted hover:bg-surface hover:text-ink rounded-lg p-1.5 transition-colors disabled:opacity-30"
                    >
                      <Chevron className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(index, 1)}
                      disabled={index === categories.length - 1}
                      aria-label={`Move ${category.name} down`}
                      title="Move down"
                      className="text-muted hover:bg-surface hover:text-ink rounded-lg p-1.5 transition-colors disabled:opacity-30"
                    >
                      <Chevron className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      aria-label={`Remove ${category.name}`}
                      title="Remove"
                      className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-5 text-xs">No categories featured yet.</p>
            )}

            {categories.length < POPULAR_CATEGORIES_LIMIT ? (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="border-line text-ink hover:bg-cream mt-4 inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                <Tag className="h-4 w-4" /> Add a category
              </button>
            ) : (
              <p className="text-muted mt-4 text-xs">
                You&apos;ve reached the limit of {POPULAR_CATEGORIES_LIMIT} categories.
              </p>
            )}
          </section>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand text-surface shadow-soft rounded-full px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save popular categories"}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="text-muted text-sm font-medium">Preview</p>
          <p className="text-muted mt-0.5 text-xs">
            Open-role counts aren&apos;t shown here — they&apos;re computed live on the home page.
          </p>
          <PopularCategoriesPreview categories={previewCategories} />
        </div>
      </form>

      {picking ? (
        <CategoryPicker
          excludeIds={categories.map((c) => c.id)}
          onClose={() => setPicking(false)}
          onPick={addCategory}
        />
      ) : null}
    </div>
  );
}

function PopularCategoriesPreview({
  categories,
}: {
  categories: { id: string; name: string; iconUrl: string | null; openRoles: number }[];
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
  }, [categories]);

  if (categories.length === 0) {
    return (
      <div className="border-line bg-cream text-muted mt-2 grid h-40 place-items-center rounded-2xl border text-sm">
        Nothing to preview yet — add a category.
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
        <JobCategories categories={categories} />
      </div>
    </div>
  );
}
