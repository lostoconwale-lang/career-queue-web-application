"use client";

import { useEffect, useRef, useState } from "react";

import { SearchInput } from "@/app/_components/SearchInput";
import { Chevron } from "@/app/_components/Icons";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { LinkOptionDTO } from "@/types/link-options";

export type LinkTargetValue =
  { type: "route"; path: string; label: string } | { type: "page"; pageId: string; label: string };

type Props = {
  value: LinkTargetValue | null;
  onChange: (value: LinkTargetValue) => void;
  error?: string;
};

// Searchable destination picker shared by the header and footer link editors —
// backed by GET /api/v1/link-options (known routes + static pages).
export function LinkTargetField({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<LinkOptionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      fetch(`/api/v1/link-options?${params.toString()}`, { cache: "no-store" })
        .then((res) =>
          redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<LinkOptionDTO[]>>),
        )
        .then((json) => {
          if (!alive || !json) return;
          if (json.success) setOptions(json.data);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [open, q]);

  function choose(option: LinkOptionDTO) {
    onChange(
      option.type === "route"
        ? { type: "route", path: option.value, label: option.label }
        : { type: "page", pageId: option.value, label: option.label },
    );
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={rootRef} className="relative">
      <span className="text-ink text-sm font-medium">Destination</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`mt-1.5 flex w-full items-center gap-2 rounded-2xl border py-2.5 pr-3 pl-4 text-left text-sm transition-colors ${
          error ? "border-coral/60" : "border-line hover:border-brand/40"
        }`}
      >
        <span className={`flex-1 truncate ${value ? "text-ink" : "text-muted"}`}>
          {value ? value.label : "Choose a page or route…"}
        </span>
        {value ? (
          <span className="bg-cream text-muted shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
            {value.type === "route" ? "Route" : "Page"}
          </span>
        ) : null}
        <Chevron
          className={`text-muted h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {error ? <p className="text-coral mt-1 text-xs">{error}</p> : null}

      {open ? (
        <div className="border-line bg-surface shadow-lift absolute top-full left-0 z-50 mt-2 w-full rounded-2xl border p-2">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search pages and routes…"
            ariaLabel="Search pages and routes"
          />
          <div role="listbox" aria-label="Destination" className="mt-2 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="text-muted px-2 py-3 text-sm">Loading…</p>
            ) : options.length === 0 ? (
              <p className="text-muted px-2 py-3 text-sm">No matches.</p>
            ) : (
              <ul>
                {options.map((option) => (
                  <li key={`${option.type}-${option.value}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={
                        value?.type === option.type &&
                        (value.type === "route" ? value.path : value.pageId) === option.value
                      }
                      onClick={() => choose(option)}
                      className="hover:bg-cream flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors"
                    >
                      <span className="text-ink truncate">{option.label}</span>
                      <span className="bg-cream text-muted shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
                        {option.type === "route" ? "Route" : "Page"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
