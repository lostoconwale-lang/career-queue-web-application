"use client";

import type { ReactNode } from "react";

import { Check } from "@/app/_components/Icons";
import type { JobFilterOption } from "@/types/public-job";

export type JobFiltersState = {
  categories: string[];
  jobTypes: string[];
};

type Props = {
  categories: JobFilterOption[];
  jobTypes: JobFilterOption[];
  selected: JobFiltersState;
  onToggleCategory: (id: string) => void;
  onToggleJobType: (id: string) => void;
  onClearAll: () => void;
  /** Extra classes for the outer wrapper (e.g. sticky positioning on desktop). */
  className?: string;
};

export function JobFilters({
  categories,
  jobTypes,
  selected,
  onToggleCategory,
  onToggleJobType,
  onClearAll,
  className = "",
}: Props) {
  const activeCount = selected.categories.length + selected.jobTypes.length;

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-ink text-lg font-semibold">Filters</h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="text-brand text-sm font-semibold hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <FilterSection title="Category">
        {categories.map((category) => (
          <FilterCheckbox
            key={category.id}
            label={category.name}
            count={category.count}
            checked={selected.categories.includes(category.id)}
            onChange={() => onToggleCategory(category.id)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Job type">
        {jobTypes.map((jobType) => (
          <FilterCheckbox
            key={jobType.id}
            label={jobType.name}
            count={jobType.count}
            checked={selected.jobTypes.includes(jobType.id)}
            onChange={() => onToggleJobType(jobType.id)}
          />
        ))}
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-line bg-surface rounded-card border p-5">
      <h3 className="text-ink text-sm font-semibold">{title}</h3>
      <div className="mt-3 max-h-64 space-y-0.5 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-cream">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
          checked
            ? "bg-brand border-brand"
            : "border-line bg-surface group-hover:border-brand/40"
        }`}
      >
        {checked ? <Check className="text-surface h-3 w-3" /> : null}
      </span>
      <span className="text-ink min-w-0 flex-1 truncate text-sm">{label}</span>
      <span className="text-muted text-xs tabular-nums">{count}</span>
    </label>
  );
}
