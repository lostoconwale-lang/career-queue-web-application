import type { ReactNode } from "react";

import { ChevronLeft, ChevronRight } from "@/app/_components/Icons";

export function Badge({ tone, children }: { tone: "neutral" | "brand" | "danger"; children: ReactNode }) {
  const toneClass = {
    neutral: "bg-cream text-muted",
    brand: "bg-brand-soft text-brand",
    danger: "bg-coral/10 text-coral",
  }[tone];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  onClick,
  disabled,
  tone = "brand",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "brand" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-coral/40 text-coral hover:bg-coral/10"
      : "border-brand/40 text-brand hover:bg-brand-soft";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-brand" : "bg-line"
      }`}
    >
      <span
        className={`bg-surface inline-block h-5 w-5 rounded-full shadow-sm transition-transform ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// Prev / page-number / next footer for a cursor-paginated table.
export function Pager({
  page,
  rangeStart,
  rowCount,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number;
  rangeStart: number;
  rowCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <p className="text-muted text-sm">
        {rowCount > 0 ? (
          <>
            Showing{" "}
            <span className="text-ink font-medium tabular-nums">
              {rangeStart}–{rangeStart + rowCount - 1}
            </span>
          </>
        ) : (
          "No results"
        )}
      </p>
      <div className="border-line inline-flex items-center gap-1 rounded-full border p-1">
        <PagerButton direction="prev" disabled={!hasPrev} onClick={onPrev} />
        <span className="text-muted px-2 text-xs font-medium tabular-nums">Page {page}</span>
        <PagerButton direction="next" disabled={!hasNext} onClick={onNext} />
      </div>
    </div>
  );
}

function PagerButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
}) {
  const label = direction === "prev" ? "Previous" : "Next";
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="text-ink hover:bg-cream disabled:text-muted/40 flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      {direction === "prev" ? <Icon className="h-4 w-4" /> : null}
      <span className="hidden sm:inline">{label}</span>
      {direction === "next" ? <Icon className="h-4 w-4" /> : null}
    </button>
  );
}
