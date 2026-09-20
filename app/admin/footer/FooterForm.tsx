"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

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
  FOOTER_LINKS_PER_SECTION_MAX,
  type FooterDTO,
  type FooterLinkTarget,
  type FooterSectionDTO,
} from "@/types/footer";

type LinkDraft = {
  key: string;
  label: string;
  target: LinkTargetValue | null;
  isActive: boolean;
};

type SectionDraft = {
  heading: string;
  links: LinkDraft[];
};

function targetFromDTO(target: FooterLinkTarget): LinkTargetValue {
  if (target.type === "route") {
    const route = SITE_ROUTES.find((r) => r.path === target.path);
    return { type: "route", path: target.path, label: route?.label ?? target.path };
  }
  return { type: "page", pageId: target.pageId, label: target.title };
}

function sectionsFromDTO(sections: FooterSectionDTO[]): SectionDraft[] {
  return sections.map((section) => ({
    heading: section.heading,
    links: section.links.map((l) => ({
      key: l.id,
      label: l.label,
      target: targetFromDTO(l.target),
      isActive: l.isActive,
    })),
  }));
}

export function FooterForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/footer", { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<FooterDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        setSections(sectionsFromDTO(json.data.sections));
      })
      .catch(() => {
        if (alive) setLoadError("Could not load the footer.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function updateSectionHeading(index: number, heading: string) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, heading } : s)));
  }

  function updateSectionLinks(index: number, links: LinkDraft[]) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, links } : s)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    const invalid = sections.some(
      (s) =>
        s.heading.trim().length < 1 || s.links.some((l) => l.label.trim().length < 1 || !l.target),
    );
    if (invalid) {
      setFormError("Finish editing the incomplete sections or links before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: sections.map((s) => ({
            heading: s.heading.trim(),
            links: s.links.map((l) => ({
              label: l.label.trim(),
              targetType: l.target?.type,
              routePath: l.target?.type === "route" ? l.target.path : undefined,
              pageId: l.target?.type === "page" ? l.target.pageId : undefined,
              isActive: l.isActive,
            })),
          })),
        }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<FooterDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save the footer.");
        return;
      }
      setSections(sectionsFromDTO(json.data.sections));
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
        Footer
      </h1>
      <p className="text-muted mt-2 max-w-2xl text-sm">
        Manage the two link columns shown in the site footer. The brand column (logo, description,
        social links) comes from{" "}
        <Link href="/admin/settings" className="text-brand font-semibold">
          Settings
        </Link>
        .
      </p>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      {saved ? (
        <p className="border-brand/30 bg-brand-soft text-brand mt-5 rounded-2xl border px-4 py-3 text-sm">
          Footer saved.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-5xl gap-6 lg:grid-cols-2">
        {sections.map((section, index) => (
          <FooterSectionEditor
            key={index}
            index={index}
            section={section}
            onHeadingChange={(heading) => updateSectionHeading(index, heading)}
            onLinksChange={(links) => updateSectionLinks(index, links)}
          />
        ))}

        <div className="flex justify-end lg:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand text-surface shadow-soft rounded-full px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save footer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FooterSectionEditor({
  index,
  section,
  onHeadingChange,
  onLinksChange,
}: {
  index: number;
  section: SectionDraft;
  onHeadingChange: (heading: string) => void;
  onLinksChange: (links: LinkDraft[]) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const { links } = section;

  function removeLink(key: string) {
    onLinksChange(links.filter((l) => l.key !== key));
  }

  function moveLink(linkIndex: number, direction: -1 | 1) {
    const target = linkIndex + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    const [moved] = next.splice(linkIndex, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    onLinksChange(next);
  }

  function reorder(fromKey: string, toKey: string) {
    if (fromKey === toKey) return;
    const fromIndex = links.findIndex((l) => l.key === fromKey);
    const toIndex = links.findIndex((l) => l.key === toKey);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...links];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    onLinksChange(next);
  }

  function handleDrop(key: string) {
    if (dragKey) reorder(dragKey, key);
    setDragKey(null);
    setDragOverKey(null);
  }

  const editingLink = editingKey ? (links.find((l) => l.key === editingKey) ?? null) : null;

  return (
    <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
      <AuthField
        label="Section heading"
        name={`heading-${index}`}
        maxLength={40}
        value={section.heading}
        onChange={(e) => onHeadingChange(e.target.value)}
      />

      <p className="text-muted mt-4 text-sm">
        Up to {FOOTER_LINKS_PER_SECTION_MAX} links. Drag a card by its handle to reorder.
      </p>

      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {links.map((link, linkIndex) => {
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
              className={`group border-line bg-surface flex flex-col rounded-2xl border p-3 transition-all ${
                dragKey === link.key ? "opacity-40" : ""
              } ${dragOverKey === link.key ? "border-brand ring-brand/30 ring-2" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-muted/60 group-hover:text-muted -m-1 cursor-grab touch-none rounded-lg p-1 transition-colors active:cursor-grabbing"
                  title="Drag to reorder"
                  aria-hidden
                >
                  <GripDots className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveLink(linkIndex, -1)}
                    disabled={linkIndex === 0}
                    aria-label={`Move ${link.label || "link"} up`}
                    title="Move up"
                    className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1 transition-colors disabled:opacity-25"
                  >
                    <Chevron className="h-3.5 w-3.5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLink(linkIndex, 1)}
                    disabled={linkIndex === links.length - 1}
                    aria-label={`Move ${link.label || "link"} down`}
                    title="Move down"
                    className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1 transition-colors disabled:opacity-25"
                  >
                    <Chevron className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-ink mt-1.5 truncate text-sm font-semibold">
                {link.label || "Untitled link"}
              </p>
              <p className="text-muted mt-1 flex items-center gap-1 truncate text-xs">
                <LinkIcon className="h-3 w-3 shrink-0" />
                {link.target?.label ?? "No destination set"}
              </p>

              {incomplete ? (
                <p className="text-coral mt-1.5 text-[11px] font-medium">
                  Incomplete — needs editing
                </p>
              ) : (
                <span
                  className={`mt-1.5 w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    link.isActive ? "bg-brand-soft text-brand" : "bg-cream text-muted"
                  }`}
                >
                  {link.isActive ? "Visible" : "Hidden"}
                </span>
              )}

              <div className="border-line mt-auto flex items-center justify-between gap-2 border-t pt-2.5">
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

        {links.length < FOOTER_LINKS_PER_SECTION_MAX ? (
          <li>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="border-line text-muted hover:border-brand/40 hover:text-brand hover:bg-brand-soft flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-sm font-semibold transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add a link
            </button>
          </li>
        ) : null}
      </ul>

      {links.length >= FOOTER_LINKS_PER_SECTION_MAX ? (
        <p className="text-muted mt-3 text-xs">
          You&apos;ve reached the limit of {FOOTER_LINKS_PER_SECTION_MAX} links.
        </p>
      ) : null}

      {editingLink ? (
        <FooterLinkModal
          key={editingLink.key}
          initial={editingLink}
          onCancel={() => setEditingKey(null)}
          onSave={(patch) => {
            onLinksChange(links.map((l) => (l.key === editingLink.key ? { ...l, ...patch } : l)));
            setEditingKey(null);
          }}
        />
      ) : null}

      {creating ? (
        <FooterLinkModal
          onCancel={() => setCreating(false)}
          onSave={(patch) => {
            onLinksChange([...links, { key: crypto.randomUUID(), ...patch }]);
            setCreating(false);
          }}
        />
      ) : null}
    </section>
  );
}

function FooterLinkModal({
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
    onSave({ label: label.trim(), target, isActive });
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
        aria-label={initial ? "Edit footer link" : "Add footer link"}
        className="bg-surface shadow-lift relative flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-ink text-lg font-semibold">
            {initial ? "Edit footer link" : "Add footer link"}
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
