"use client";

import { ChevronLeft, ChevronRight } from "@/app/_components/Icons";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

// Numbered pagination with a windowed ellipsis for long result sets — e.g.
// "1 … 4 5 6 … 12" — so it stays usable regardless of how many pages exist.
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
}

export function JobPagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Job results pages" className="mt-10 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="border-line text-ink hover:bg-cream disabled:text-muted/40 grid h-10 w-10 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="text-muted px-1.5 text-sm">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={`grid h-10 w-10 place-items-center rounded-full text-sm font-medium tabular-nums transition-colors ${
              entry === page
                ? "bg-brand text-surface shadow-soft"
                : "text-muted hover:bg-cream hover:text-ink"
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="border-line text-ink hover:bg-cream disabled:text-muted/40 grid h-10 w-10 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
