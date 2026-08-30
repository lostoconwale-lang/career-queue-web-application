"use client";

import { SearchGlass } from "@/app/_components/Icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

// The search field at the top of the job listing page. Debounced updates to
// the URL happen in the parent (JobListingPage); this just owns the pill UI.
export function JobSearchBar({
  value,
  onChange,
  onSubmit,
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
