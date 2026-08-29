"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";

import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { MediaDTO } from "@/types/media";
import { Close, FileText } from "@/app/_components/Icons";

const MAX_FILES = 5;
const MAX_SIZE = 25 * 1024 * 1024;
const ACCEPTED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];

export function UploadDialog({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)),
    [previews],
  );

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [submitting, onClose]);

  function addFiles(incoming: File[]) {
    setError(null);
    setFiles((current) => {
      const next = [...current];
      for (const file of incoming) {
        if (next.length >= MAX_FILES) {
          setError(`You can upload up to ${MAX_FILES} files at once.`);
          break;
        }
        if (!ACCEPTED.includes(file.type)) {
          setError(`${file.name}: unsupported file type.`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          setError(`${file.name} is larger than 25 MB.`);
          continue;
        }
        if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
        next.push(file);
      }
      return next;
    });
  }

  function removeAt(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 15) return;
    setTags((prev) => [...prev, tag]);
  }

  function onTagKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (event.key === "Backspace" && !tagInput) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    if (!submitting) addFiles(Array.from(event.dataTransfer.files));
  }

  async function submit() {
    if (files.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      files.forEach((file) => body.append("files", file));
      const allTags = tagInput.trim() ? [...tags, tagInput.trim().toLowerCase()] : tags;
      allTags.forEach((tag) => body.append("tags", tag));
      const res = await fetch("/api/v1/media", { method: "POST", body });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<MediaDTO[]>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      onUploaded();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => !submitting && onClose()}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-dialog-title"
        className="bg-surface shadow-lift relative max-h-full w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-7"
      >
        <h2 id="upload-dialog-title" className="font-display text-ink text-xl font-semibold">
          Upload files
        </h2>
        <p className="text-muted mt-1 text-sm">
          Up to {MAX_FILES} files, 25 MB each. Images, video, PDF and documents.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
            dragging
              ? "border-brand bg-brand-soft"
              : "border-line hover:border-brand/50 hover:bg-cream"
          }`}
        >
          <span className="text-ink text-sm font-semibold">Drop files here or click to browse</span>
          <span className="text-muted mt-1 text-xs">
            {files.length} / {MAX_FILES} selected
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          hidden
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        {error ? (
          <p className="border-coral/30 bg-coral/10 text-coral mt-4 rounded-2xl border px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        {previews.length > 0 ? (
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {previews.map((preview, index) => (
              <li key={`${preview.file.name}-${preview.file.size}`} className="group relative">
                <div className="bg-cream flex aspect-square items-center justify-center overflow-hidden rounded-xl">
                  {preview.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.url}
                      alt={preview.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="text-muted h-8 w-8" />
                  )}
                </div>
                <p className="text-muted mt-1 truncate text-xs" title={preview.file.name}>
                  {preview.file.name}
                </p>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove ${preview.file.name}`}
                  className="bg-ink/70 text-surface absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Close className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5">
          <span className="text-ink text-sm font-medium">Tags</span>
          <div className="border-line focus-within:border-brand focus-within:ring-brand/10 mt-2 flex flex-wrap gap-2 rounded-2xl border px-3 py-2.5 transition-colors focus-within:ring-4">
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
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagKey}
              placeholder={tags.length ? "" : "Applied to every file — press Enter to add"}
              className="text-ink placeholder:text-muted/50 min-w-32 flex-1 bg-transparent py-1 text-sm outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="border-line text-ink hover:bg-cream rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || files.length === 0}
            className="bg-brand text-surface rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "Uploading…"
              : `Upload${files.length > 0 ? ` ${files.length} file${files.length > 1 ? "s" : ""}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
