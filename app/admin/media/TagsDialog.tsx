"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

import { redirectOnDenied } from "@/lib/auth-redirect";
import { Close } from "@/app/_components/Icons";
import type { ApiResponse } from "@/types/api";
import type { MediaDTO } from "@/types/media";

export function TagsDialog({
  media,
  onClose,
  onSaved,
}: {
  media: MediaDTO;
  onClose: () => void;
  onSaved: (updated: MediaDTO) => void;
}) {
  const [tags, setTags] = useState<string[]>(media.tags);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [saving, onClose]);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 15) return;
    setTags((prev) => [...prev, tag]);
  }

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(input);
      setInput("");
    } else if (event.key === "Backspace" && !input) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const pending = input.trim() ? [...tags, input.trim().toLowerCase()] : tags;
      const res = await fetch(`/api/v1/media/${media.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: pending }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<MediaDTO>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      onSaved(json.data);
    } catch {
      setError("Could not save tags. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => !saving && onClose()}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tags-dialog-title"
        className="bg-surface shadow-lift relative w-full max-w-md rounded-3xl p-6 sm:p-7"
      >
        <h2 id="tags-dialog-title" className="font-display text-ink text-xl font-semibold">
          Tags
        </h2>
        <p className="text-muted mt-1 truncate text-sm" title={media.originalName}>
          {media.originalName}
        </p>

        {error ? (
          <p className="border-coral/30 bg-coral/10 text-coral mt-4 rounded-2xl border px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        <div className="border-line focus-within:border-brand focus-within:ring-brand/10 mt-5 flex flex-wrap gap-2 rounded-2xl border px-3 py-2.5 transition-colors focus-within:ring-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-brand-soft text-brand inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
            >
              {tag}
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                aria-label={`Remove ${tag}`}
              >
                <Close className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onInputKey}
            placeholder={tags.length ? "" : "Add a tag, press Enter"}
            className="text-ink placeholder:text-muted/50 min-w-24 flex-1 bg-transparent py-1 text-sm outline-none"
          />
        </div>
        <p className="text-muted mt-1.5 text-xs">Press Enter or comma to add. {tags.length}/15.</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="border-line text-ink hover:bg-cream rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-brand text-surface rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save tags"}
          </button>
        </div>
      </div>
    </div>
  );
}
