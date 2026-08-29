"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { SearchInput } from "@/app/_components/SearchInput";
import { Pager } from "@/app/admin/_components/table-ui";
import { Check, Close, Eye, FileText, Link, Play, Tag, Trash } from "@/app/_components/Icons";
import { UploadDialog } from "./UploadDialog";
import { TagsDialog } from "./TagsDialog";
import { PreviewDialog } from "./PreviewDialog";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { MediaDTO, MediaFileType } from "@/types/media";

type Filter = "" | MediaFileType;

const PAGE_SIZE = 24;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "document", label: "Documents" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary() {
  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState<{ q: string; fileType: Filter; tag: string }>({
    q: "",
    fileType: "",
    tag: "",
  });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [data, setData] = useState<CursorPage<MediaDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<MediaDTO | null>(null);
  const [tagging, setTagging] = useState<MediaDTO | null>(null);
  const [previewing, setPreviewing] = useState<MediaDTO | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function patchQuery(patch: Partial<typeof query>) {
    setQuery((prev) => ({ ...prev, ...patch }));
    setCursors([null]);
  }

  useEffect(() => {
    const next = qInput.trim();
    if (next === query.q) return;
    const t = setTimeout(() => {
      setQuery((prev) => ({ ...prev, q: next }));
      setCursors([null]);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput, query.q]);

  useEffect(() => {
    let alive = true;
    const cursor = cursors[cursors.length - 1];
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    if (query.q) params.set("q", query.q);
    if (query.fileType) params.set("fileType", query.fileType);
    if (query.tag) params.set("tag", query.tag);

    fetch(`/api/v1/media?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<CursorPage<MediaDTO>>>;
      })
      .then((json) => {
        if (!alive || !json) return;
        if (json.success) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.error.message);
        }
      })
      .catch(() => {
        if (alive) setError("Could not load the media library.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cursors, query, reloadKey]);

  function goNext() {
    const next = data?.nextCursor;
    if (data?.hasMore && next) setCursors((c) => [...c, next]);
  }
  function goPrev() {
    setCursors((c) => (c.length > 1 ? c.slice(0, -1) : c));
  }

  async function copyLink(item: MediaDTO) {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((id) => (id === item.id ? null : id)), 1500);
    } catch {
      setError("Could not copy the link.");
    }
  }

  function applyTagUpdate(updated: MediaDTO) {
    setData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((m) => (m.id === updated.id ? updated : m)) }
        : prev,
    );
    setTagging(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/media/${deleting.id}`, { method: "DELETE" });
      if (redirectOnDenied(res)) return;
      if (!res.ok) {
        const message = await res
          .json()
          .then((j: ApiResponse<unknown>) => (j.success ? null : j.error.message))
          .catch(() => null);
        setError(message ?? `Delete failed (HTTP ${res.status}).`);
        return;
      }
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  }

  const items = data?.items ?? [];
  const pageNum = cursors.length;
  const rangeStart = (pageNum - 1) * PAGE_SIZE + 1;
  const hasPrev = cursors.length > 1;
  const hasNext = Boolean(data?.hasMore);
  const showPager = hasPrev || hasNext || items.length > 0;

  return (
    <div className="px-5 py-10 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            Media
          </h1>
          <p className="text-muted mt-2 text-sm">
            Files uploaded for cities, categories and job pages. Copy a link to use it anywhere.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploading(true)}
          className="bg-brand text-surface shadow-soft shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          Upload
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="bg-cream flex gap-1 rounded-2xl p-1 text-sm">
          {FILTERS.map((f) => (
            <button
              key={f.key || "all"}
              type="button"
              onClick={() => patchQuery({ fileType: f.key })}
              aria-pressed={query.fileType === f.key}
              className={`rounded-2xl px-3.5 py-1.5 font-medium transition-colors ${
                query.fileType === f.key
                  ? "bg-surface text-ink shadow-soft"
                  : "text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchInput
          value={qInput}
          onChange={setQInput}
          placeholder="Search by file name or tag…"
          ariaLabel="Search media by file name or tag"
          className="ml-auto w-full sm:w-72"
        />
      </div>

      {query.tag ? (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-muted">Tag:</span>
          <button
            type="button"
            onClick={() => patchQuery({ tag: "" })}
            className="bg-brand-soft text-brand inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          >
            {query.tag}
            <Close className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <p className="text-muted py-16 text-center text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <div className="border-line rounded-2xl border border-dashed py-16 text-center">
            <p className="text-ink text-sm font-medium">No files here yet</p>
            <button
              type="button"
              onClick={() => setUploading(true)}
              className="text-brand mt-1 text-sm font-semibold hover:underline"
            >
              Upload your first file
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <li
                key={item.id}
                className="border-line bg-surface shadow-soft overflow-hidden rounded-2xl border"
              >
                <button
                  type="button"
                  onClick={() => setPreviewing(item)}
                  aria-label={`Preview ${item.originalName}`}
                  className="bg-cream group relative flex aspect-square w-full items-center justify-center"
                >
                  {item.fileType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.originalName}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : item.fileType === "video" ? (
                    <Play className="text-muted h-9 w-9" />
                  ) : (
                    <FileText className="text-muted h-9 w-9" />
                  )}
                  {item.fileType === "video" ? (
                    <span className="bg-ink/30 group-hover:bg-ink/20 absolute inset-0 grid place-items-center transition-colors">
                      <span className="bg-surface/90 grid h-12 w-12 place-items-center rounded-full">
                        <Play className="text-ink ml-0.5 h-5 w-5" />
                      </span>
                    </span>
                  ) : null}
                </button>

                <div className="p-3">
                  <p className="text-ink truncate text-sm font-medium" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p
                    className="text-muted mt-0.5 text-xs"
                    title={formatDateTime(item.createdAt)}
                  >
                    {formatBytes(item.size)} · {formatRelativeTime(item.createdAt)}
                  </p>

                  {item.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => patchQuery({ tag })}
                          className="bg-cream text-muted hover:text-ink rounded-full px-2 py-0.5 text-xs font-medium"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-2.5 flex items-center gap-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open in a new tab"
                      title="Open in a new tab"
                      className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1.5 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(item)}
                      aria-label="Copy link"
                      title={copiedId === item.id ? "Copied" : "Copy link"}
                      className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1.5 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="text-brand h-4 w-4" />
                      ) : (
                        <Link className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTagging(item)}
                      className="border-line text-muted hover:border-brand/40 hover:text-brand ml-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      Tags{item.tags.length ? ` ${item.tags.length}` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(item)}
                      disabled={busyId === item.id}
                      aria-label={`Delete ${item.originalName}`}
                      className="text-coral hover:bg-coral/10 ml-auto rounded-lg p-1.5 transition-colors disabled:opacity-50"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showPager && !loading ? (
        <Pager
          page={pageNum}
          rangeStart={rangeStart}
          rowCount={items.length}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={goPrev}
          onNext={goNext}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        busy={deleting ? busyId === deleting.id : false}
        tone="danger"
        title="Delete this file?"
        description={
          deleting
            ? `"${deleting.originalName}" will be removed from storage and any page still using it will break.`
            : null
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {previewing ? (
        <PreviewDialog media={previewing} onClose={() => setPreviewing(null)} />
      ) : null}

      {tagging ? (
        <TagsDialog
          media={tagging}
          onClose={() => setTagging(null)}
          onSaved={applyTagUpdate}
        />
      ) : null}

      {uploading ? (
        <UploadDialog
          onClose={() => setUploading(false)}
          onUploaded={() => {
            setUploading(false);
            setCursors([null]);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}
