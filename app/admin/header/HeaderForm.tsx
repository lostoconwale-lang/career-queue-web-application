"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "@/app/_components/AuthField";
import { Chevron, Link as LinkIcon, Trash } from "@/app/_components/Icons";
import { Switch } from "@/app/admin/_components/table-ui";
import {
  HeaderLinkTargetField,
  type HeaderLinkTargetValue,
} from "@/app/admin/_components/HeaderLinkTargetField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { SITE_ROUTES } from "@/lib/site-routes";
import type { ApiResponse } from "@/types/api";
import {
  HEADER_LINKS_MAX,
  type HeaderDTO,
  type HeaderLinkTarget,
  type HeaderVisibility,
} from "@/types/header";

const VISIBILITY_OPTIONS: { value: HeaderVisibility; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "guest", label: "Signed out only" },
  { value: "auth", label: "Signed in only" },
];

type LinkDraft = {
  key: string;
  label: string;
  target: HeaderLinkTargetValue | null;
  visibility: HeaderVisibility;
  isActive: boolean;
};

function targetFromDTO(target: HeaderLinkTarget): HeaderLinkTargetValue {
  if (target.type === "route") {
    const route = SITE_ROUTES.find((r) => r.path === target.path);
    return { type: "route", path: target.path, label: route?.label ?? target.path };
  }
  return { type: "page", pageId: target.pageId, label: target.title };
}

function emptyLink(): LinkDraft {
  return { key: crypto.randomUUID(), label: "", target: null, visibility: "all", isActive: true };
}

export function HeaderForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [links, setLinks] = useState<LinkDraft[]>([]);

  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/header", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<HeaderDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        setLinks(
          json.data.links.map((l) => ({
            key: l.id,
            label: l.label,
            target: targetFromDTO(l.target),
            visibility: l.visibility,
            isActive: l.isActive,
          })),
        );
      })
      .catch(() => {
        if (alive) setLoadError("Could not load the header.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function updateLink(key: string, patch: Partial<LinkDraft>) {
    setLinks((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLink() {
    setLinks((prev) => [...prev, emptyLink()]);
  }

  function removeLink(key: string) {
    setLinks((prev) => prev.filter((l) => l.key !== key));
  }

  function moveLink(index: number, direction: -1 | 1) {
    setLinks((prev) => {
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

  const errorFor = (link: LinkDraft) => ({
    label: submitted && link.label.trim().length < 1 ? "Enter a label" : undefined,
    target: submitted && !link.target ? "Choose a destination" : undefined,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    setSubmitted(true);

    const invalid = links.some((l) => l.label.trim().length < 1 || !l.target);
    if (invalid) return;

    setSaving(true);
    try {
      const res = await fetch("/api/v1/header", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: links.map((l) => ({
            label: l.label.trim(),
            targetType: l.target?.type,
            routePath: l.target?.type === "route" ? l.target.path : undefined,
            pageId: l.target?.type === "page" ? l.target.pageId : undefined,
            visibility: l.visibility,
            isActive: l.isActive,
          })),
        }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<HeaderDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save the header.");
        return;
      }
      setLinks(
        json.data.links.map((l) => ({
          key: l.id,
          label: l.label,
          target: targetFromDTO(l.target),
          visibility: l.visibility,
          isActive: l.isActive,
        })),
      );
      setSubmitted(false);
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
        Header
      </h1>
      <p className="text-muted mt-2 max-w-2xl text-sm">
        Manage the nav links shown on the site header. Each link can go to an internal route or a
        static page, and can be shown to everyone, only signed-out visitors, or only signed-in
        visitors.
      </p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      {saved ? (
        <p className="border-brand/30 bg-brand-soft text-brand mt-5 rounded-2xl border px-4 py-3 text-sm">
          Header saved.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl">
        <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-ink text-lg font-semibold">Nav links</h2>
              <p className="text-muted mt-0.5 text-sm">Up to {HEADER_LINKS_MAX}, in this order.</p>
            </div>
          </div>

          {links.length > 0 ? (
            <ul className="mt-5 grid gap-4">
              {links.map((link, index) => {
                const error = errorFor(link);
                return (
                  <li key={link.key} className="border-line rounded-2xl border p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid flex-1 gap-3">
                        <AuthField
                          label="Label"
                          name={`label-${link.key}`}
                          maxLength={40}
                          value={link.label}
                          error={error.label}
                          onChange={(e) => updateLink(link.key, { label: e.target.value })}
                        />

                        <HeaderLinkTargetField
                          value={link.target}
                          error={error.target}
                          onChange={(target) => updateLink(link.key, { target })}
                        />

                        <div>
                          <span className="text-ink text-sm font-medium">Visibility</span>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {VISIBILITY_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateLink(link.key, { visibility: option.value })}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  link.visibility === option.value
                                    ? "border-brand bg-brand-soft text-brand"
                                    : "border-line text-muted hover:bg-cream"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Switch
                          checked={link.isActive}
                          onChange={(next) => updateLink(link.key, { isActive: next })}
                          label={`Show "${link.label || "this link"}" on the site`}
                        />
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveLink(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move link ${index + 1} up`}
                          title="Move up"
                          className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1.5 transition-colors disabled:opacity-30"
                        >
                          <Chevron className="h-4 w-4 rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLink(index, 1)}
                          disabled={index === links.length - 1}
                          aria-label={`Move link ${index + 1} down`}
                          title="Move down"
                          className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1.5 transition-colors disabled:opacity-30"
                        >
                          <Chevron className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLink(link.key)}
                          aria-label={`Remove link ${index + 1}`}
                          title="Remove"
                          className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted mt-5 text-xs">No nav links yet.</p>
          )}

          {links.length < HEADER_LINKS_MAX ? (
            <button
              type="button"
              onClick={addLink}
              className="border-line text-ink hover:bg-cream mt-4 inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <LinkIcon className="h-4 w-4" /> Add a link
            </button>
          ) : (
            <p className="text-muted mt-4 text-xs">
              You&apos;ve reached the limit of {HEADER_LINKS_MAX} links.
            </p>
          )}
        </section>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand text-surface shadow-soft rounded-full px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save header"}
          </button>
        </div>
      </form>
    </div>
  );
}
