"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { Refresh } from "@/app/_components/Icons";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";

export function CachePanel() {
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  async function clearCache() {
    setClearing(true);
    setError(null);
    setCleared(false);
    try {
      const res = await fetch("/api/v1/cache/clear", { method: "POST" });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<{ cleared: number }>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      setCleared(true);
    } catch {
      setError("Could not clear the cache. Please try again.");
    } finally {
      setClearing(false);
      setConfirming(false);
    }
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Cache
      </h1>
      <p className="text-muted mt-2 text-sm">
        The public site caches pages like the home page for speed, and refreshes them
        automatically — usually right after you save a change, and always within an hour
        otherwise.
      </p>

      <section className="bg-surface border-line shadow-soft mt-6 max-w-xl rounded-2xl border p-6 sm:p-7">
        <h2 className="font-display text-ink flex items-center gap-2 text-lg font-semibold">
          <Refresh className="h-5 w-5" /> Clear the cache
        </h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          Only use this if a page still looks out of date after saving a change elsewhere in the
          admin panel. It doesn&apos;t change or delete any content — it just forces every public
          page to reload fresh data on its next visit.
        </p>

        {error ? (
          <p className="border-coral/30 bg-coral/10 text-coral mt-4 rounded-2xl border px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}
        {cleared ? (
          <p className="border-brand/30 bg-brand-soft text-brand mt-4 rounded-2xl border px-4 py-3 text-sm">
            Cache cleared.
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="bg-brand text-surface shadow-soft mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          <Refresh className="h-4 w-4" /> Clear cache
        </button>
      </section>

      <ConfirmDialog
        open={confirming}
        busy={clearing}
        title="Clear the site cache?"
        description="Every public page will reload fresh data on its next visit. Only do this if something looks out of date."
        confirmLabel="Clear cache"
        onConfirm={clearCache}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
