"use client";

import { Close, SearchGlass } from "@/app/_components/Icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  /** Clears the input and the applied search in one step. */
  onClear?: () => void;
  placeholder?: string;
};

// The search field at the top of the job listing page. The parent
// (JobListingPage) only searches when this form is submitted — typing alone
// doesn't touch the URL or trigger a fetch.
export function JobSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Job title, keyword or company…",
}: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className="border-line bg-surface shadow-soft flex flex-col gap-2 rounded-3xl border p-2 sm:flex-row sm:items-center sm:rounded-full sm:p-2.5"
    >
      <label className="flex flex-1 items-center gap-3 px-4 py-3">
        <SearchGlass className="text-muted h-5 w-5 shrink-0" />
        <span className="sr-only">Search jobs</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="text-ink placeholder:text-muted/70 w-full bg-transparent text-base outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="text-muted hover:text-ink hover:bg-cream grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors"
          >
            <Close className="h-4 w-4" />
          </button>
        ) : null}
      </label>

      <button
        type="submit"
        className="bg-brand text-surface shadow-soft rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        Search
      </button>
    </form>
  );
}
