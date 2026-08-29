"use client";

import { useState } from "react";

import { Photo, Refresh, Trash, UploadCloud } from "@/app/_components/Icons";
import { MediaPicker } from "@/app/admin/media/MediaPicker";
import type { EmbeddedMediaDTO } from "@/types/media";

type Props = {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  value: EmbeddedMediaDTO | null;
  onChange: (media: EmbeddedMediaDTO | null) => void;
  /** Preview box aspect, e.g. "aspect-video" (default) or "aspect-square". */
  aspect?: string;
  /** Preview on a dark background — for images meant for dark surfaces. */
  dark?: boolean;
  /** Fit the whole image in the preview (for logos) instead of cropping. */
  contain?: boolean;
};

export function ImageField({
  label,
  hint,
  required,
  error,
  value,
  onChange,
  aspect = "aspect-video",
  dark = false,
  contain = false,
}: Props) {
  const [picking, setPicking] = useState(false);
  const name = value ? (value.key.split("/").pop() ?? "Selected image") : "";

  return (
    <div>
      <span className="text-ink text-sm font-medium">
        {label}
        {required ? <span className="text-coral"> *</span> : null}
      </span>
      {hint ? <p className="text-muted mt-0.5 text-xs">{hint}</p> : null}

      {value ? (
        <div className="border-line mt-2 flex items-center gap-4 rounded-2xl border p-3">
          <span
            className={`border-line relative w-28 shrink-0 overflow-hidden rounded-xl border ${aspect} ${
              dark ? "bg-ink" : "bg-cream"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt=""
              className={`h-full w-full ${contain ? "object-contain p-1.5" : "object-cover"}`}
            />
          </span>
          <p className="text-ink min-w-0 flex-1 truncate text-sm font-medium" title={name}>
            {name}
          </p>
          <button
            type="button"
            onClick={() => setPicking(true)}
            aria-label={`Change ${label.toLowerCase()}`}
            title="Change"
            className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1.5 transition-colors"
          >
            <Refresh className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${label.toLowerCase()}`}
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
          className={`mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            error
              ? "border-coral/60 text-coral bg-coral/5"
              : "border-line text-muted hover:border-brand/50 hover:bg-cream"
          }`}
        >
          <UploadCloud className="h-9 w-9" />
          <span className="text-ink text-sm font-semibold">Choose {label.toLowerCase()}</span>
          <span className="text-xs">
            <Photo className="mr-1 inline h-3.5 w-3.5" />
            Pick one from the media library
          </span>
        </button>
      )}

      {error ? <p className="text-coral mt-1.5 text-sm">{error}</p> : null}

      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(media) => {
            onChange({ id: media.id, key: media.key, url: media.url });
            setPicking(false);
          }}
        />
      ) : null}
    </div>
  );
}
