"use client";

import { useEffect, useState } from "react";

import { SearchInput } from "@/app/_components/SearchInput";
import { Close } from "@/app/_components/Icons";
import { Pager } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse, CursorPage } from "@/types/api";
import type { MediaDTO } from "@/types/media";

const PAGE_SIZE = 12;

export function MediaPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (media: MediaDTO) => void;
}) {
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [data, setData] = useState<CursorPage<MediaDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const next = qInput.trim();
    if (next === q) return;
    const t = setTimeout(() => {
      setQ(next);
      setCursors([null]);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput, q]);

  useEffect(() => {
    let alive = true;
    const cursor = cursors[cursors.length - 1];
    const params = new URLSearchParams({ fileType: "image", limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    if (q) params.set("q", q);

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
        if (alive) setError("Could not load images.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [q, cursors]);

  function goNext() {
    const next = data?.nextCursor;
    if (data?.hasMore && next) setCursors((c) => [...c, next]);
  }
  function goPrev() {
    setCursors((c) => (c.length > 1 ? c.slice(0, -1) : c));
  }

  const items = data?.items ?? [];
  const pageNum = cursors.length;
  const rangeStart = (pageNum - 1) * PAGE_SIZE + 1;
  const hasPrev = cursors.length > 1;
  const hasNext = Boolean(data?.hasMore);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onClose}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose an image"
        className="bg-surface shadow-lift relative flex max-h-full w-full max-w-3xl flex-col rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-ink text-lg font-semibold">Choose an image</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-ink"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        <SearchInput
          value={qInput}
          onChange={setQInput}
          placeholder="Search images by name or tag…"
          ariaLabel="Search images"
          className="mt-4 w-full"
        />

        {error ? (
          <p className="border-coral/30 bg-coral/10 text-coral mt-4 rounded-2xl border px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        <div className="mt-4 min-h-56 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-muted py-16 text-center text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-muted py-16 text-center text-sm">No images found.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onPick(item)}
                    title={item.originalName}
                    className="border-line hover:border-brand focus-visible:border-brand block aspect-square w-full overflow-hidden rounded-xl border transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.originalName}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 || hasPrev ? (
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
      </div>
    </div>
  );
}
