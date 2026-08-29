"use client";

import { Close, SearchGlass } from "./Icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Width / layout classes for the outer wrapper. */
  className?: string;
  ariaLabel?: string;
};

// Reusable search field: leading magnifier, trailing clear button. Drop it above
// any table and wire `value` / `onChange` to the query state.
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
  ariaLabel,
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <SearchGlass className="text-muted pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
      <input
        type="text"
        role="searchbox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="border-line bg-surface text-ink placeholder:text-muted/50 focus:border-brand focus:ring-brand/10 w-full rounded-full border py-2.5 pr-9 pl-10 text-sm transition-colors outline-none focus:ring-4"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="text-muted hover:text-ink hover:bg-cream absolute top-1/2 right-2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full transition-colors"
        >
          <Close className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
