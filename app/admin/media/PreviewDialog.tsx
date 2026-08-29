"use client";

import { useEffect } from "react";

import { Close } from "@/app/_components/Icons";
import type { MediaDTO } from "@/types/media";

export function PreviewDialog({ media, onClose }: { media: MediaDTO; onClose: () => void }) {
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

  const isPdf = media.mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="bg-ink/70 absolute inset-0"
      />
      <div className="relative flex w-full max-w-3xl flex-col">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-surface/80 hover:text-surface ml-auto mb-2"
        >
          <Close className="h-6 w-6" />
        </button>

        {media.fileType === "video" ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-h-[80vh] w-full rounded-2xl bg-black"
          />
        ) : media.fileType === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.url}
            alt={media.originalName}
            className="max-h-[80vh] w-full rounded-2xl object-contain"
          />
        ) : isPdf ? (
          <iframe
            src={media.url}
            title={media.originalName}
            className="bg-surface h-[80vh] w-full rounded-2xl"
          />
        ) : (
          <div className="bg-surface rounded-2xl p-10 text-center">
            <p className="text-ink text-sm font-medium">This file type can&apos;t be previewed.</p>
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand mt-2 inline-block text-sm font-semibold hover:underline"
            >
              Open in a new tab
            </a>
          </div>
        )}

        <p className="text-surface/90 mt-3 truncate text-center text-sm" title={media.originalName}>
          {media.originalName}
        </p>
      </div>
    </div>
  );
}
