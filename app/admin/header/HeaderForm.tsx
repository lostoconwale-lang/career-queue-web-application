"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "@/app/_components/AuthField";
import {
  Chevron,
  Close,
  GripDots,
  Link as LinkIcon,
  Pencil,
  Plus,
  Trash,
} from "@/app/_components/Icons";
import { Switch } from "@/app/admin/_components/table-ui";
import { LinkTargetField, type LinkTargetValue } from "@/app/admin/_components/LinkTargetField";
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

const visibilityLabel = (value: HeaderVisibility) =>
  VISIBILITY_OPTIONS.find((o) => o.value === value)?.label ?? value;

type LinkDraft = {
  key: string;
  label: string;
  target: LinkTargetValue | null;
  visibility: HeaderVisibility;
  isActive: boolean;
};

function targetFromDTO(target: HeaderLinkTarget): LinkTargetValue {
  if (target.type === "route") {
    const route = SITE_ROUTES.find((r) => r.path === target.path);
    return { type: "route", path: target.path, label: route?.label ?? target.path };
  }
  return { type: "page", pageId: target.pageId, label: target.title };
}

function draftFromDTO(link: {
  id: string;
  label: string;
  target: HeaderLinkTarget;
  visibility: HeaderVisibility;
  isActive: boolean;
}): LinkDraft {
  return {
    key: link.id,
    label: link.label,
    target: targetFromDTO(link.target),
    visibility: link.visibility,
    isActive: link.isActive,
  };
}

export function HeaderForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [links, setLinks] = useState<LinkDraft[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

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
        setLinks(json.data.links.map(draftFromDTO));
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

  function removeLink(key: string) {
    setLinks((prev) => prev.filter((l) => l.key !== key));
  }

  function moveLink(index: number, direction: -1 | 1) {
    setLinks((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      if (!moved) return prev;
      next.splice(target, 0, moved);
      return next;
    });
  }

  function reorder(fromKey: string, toKey: string) {
    if (fromKey === toKey) return;
    setLinks((prev) => {
      const fromIndex = prev.findIndex((l) => l.key === fromKey);
      const toIndex = prev.findIndex((l) => l.key === toKey);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleDrop(key: string) {
    if (dragKey) reorder(dragKey, key);
    setDragKey(null);
    setDragOverKey(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    const invalid = links.some((l) => l.label.trim().length < 1 || !l.target);
    if (invalid) {
      setFormError("Finish editing the incomplete links before saving.");
      return;
    }

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
      setLinks(json.data.links.map(draftFromDTO));
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

  const editingLink = editingKey ? (links.find((l) => l.key === editingKey) ?? null) : null;

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

      <form onSubmit={handleSubmit} className="mt-6 max-w-5xl">
        <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-ink text-lg font-semibold">Nav links</h2>
              <p className="text-muted mt-0.5 text-sm">
                Up to {HEADER_LINKS_MAX}. Drag a card by its handle to reorder.
              </p>
            </div>
          </div>

          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {links.map((link, index) => {
              const incomplete = link.label.trim().length < 1 || !link.target;
              return (
                <li
                  key={link.key}
                  draggable
                  onDragStart={() => setDragKey(link.key)}
                  onDragEnter={() => {
                    if (dragKey && dragKey !== link.key) setDragOverKey(link.key);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(link.key)}
                  onDragEnd={() => {
                    setDragKey(null);
                    setDragOverKey(null);
                  }}
                  className={`group border-line bg-surface flex flex-col rounded-2xl border p-4 transition-all ${
                    dragKey === link.key ? "opacity-40" : ""
                  } ${dragOverKey === link.key ? "border-brand ring-brand/30 ring-2" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-muted/60 group-hover:text-muted -m-1 cursor-grab touch-none rounded-lg p-1 transition-colors active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-hidden
                    >
                      <GripDots className="h-5 w-5" />
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveLink(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${link.label || "link"} up`}
                        title="Move up"
                        className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1 transition-colors disabled:opacity-25"
                      >
                        <Chevron className="h-3.5 w-3.5 rotate-180" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLink(index, 1)}
                        disabled={index === links.length - 1}
                        aria-label={`Move ${link.label || "link"} down`}
                        title="Move down"
                        className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1 transition-colors disabled:opacity-25"
                      >
                        <Chevron className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-ink mt-2 truncate text-sm font-semibold">
                    {link.label || "Untitled link"}
                  </p>
                  <p className="text-muted mt-1 flex items-center gap-1 truncate text-xs">
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    {link.target?.label ?? "No destination set"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="bg-cream text-muted rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {visibilityLabel(link.visibility)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        link.isActive ? "bg-brand-soft text-brand" : "bg-cream text-muted"
                      }`}
                    >
                      {link.isActive ? "Visible" : "Hidden"}
                    </span>
                  </div>

                  {incomplete ? (
                    <p className="text-coral mt-2 text-[11px] font-medium">
                      Incomplete — needs editing
                    </p>
                  ) : null}

                  <div className="border-line mt-auto flex items-center justify-between gap-2 border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingKey(link.key)}
                      className="text-brand hover:bg-brand-soft inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLink(link.key)}
                      aria-label={`Remove ${link.label || "link"}`}
                      title="Remove"
                      className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}

            {links.length < HEADER_LINKS_MAX ? (
              <li>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="border-line text-muted hover:border-brand/40 hover:text-brand hover:bg-brand-soft flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-sm font-semibold transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add a link
                </button>
              </li>
            ) : null}
          </ul>

          {links.length >= HEADER_LINKS_MAX ? (
            <p className="text-muted mt-4 text-xs">
              You&apos;ve reached the limit of {HEADER_LINKS_MAX} links.
            </p>
          ) : null}
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

      {editingLink ? (
        <HeaderLinkModal
          key={editingLink.key}
          initial={editingLink}
          onCancel={() => setEditingKey(null)}
          onSave={(patch) => {
            updateLink(editingLink.key, patch);
            setEditingKey(null);
          }}
        />
      ) : null}

      {creating ? (
        <HeaderLinkModal
          onCancel={() => setCreating(false)}
          onSave={(patch) => {
            setLinks((prev) => [...prev, { key: crypto.randomUUID(), ...patch }]);
            setCreating(false);
          }}
        />
      ) : null}
    </div>
  );
}

function HeaderLinkModal({
  initial,
  onSave,
  onCancel,
}: {
  initial?: LinkDraft;
  onSave: (patch: Omit<LinkDraft, "key">) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [target, setTarget] = useState<LinkTargetValue | null>(initial?.target ?? null);
  const [visibility, setVisibility] = useState<HeaderVisibility>(initial?.visibility ?? "all");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  const errors = {
    label: submitted && label.trim().length < 1 ? "Enter a label" : undefined,
    target: submitted && !target ? "Choose a destination" : undefined,
  };

  function handleSave() {
    setSubmitted(true);
    if (label.trim().length < 1 || !target) return;
    onSave({ label: label.trim(), target, visibility, isActive });
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Edit nav link" : "Add nav link"}
        className="bg-surface shadow-lift relative flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-ink text-lg font-semibold">
            {initial ? "Edit nav link" : "Add nav link"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-muted hover:text-ink"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          <AuthField
            label="Label"
            name="label"
            maxLength={40}
            value={label}
            error={errors.label}
            onChange={(e) => setLabel(e.target.value)}
          />

          <LinkTargetField value={target} error={errors.target} onChange={setTarget} />

          <div>
            <span className="text-ink text-sm font-medium">Visibility</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    visibility === option.value
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
            checked={isActive}
            onChange={setIsActive}
            label={`Show "${label || "this link"}" on the site`}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="border-line text-ink hover:bg-cream rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-brand text-surface shadow-soft rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            {initial ? "Save changes" : "Add link"}
          </button>
        </div>
      </div>
    </div>
  );
}
