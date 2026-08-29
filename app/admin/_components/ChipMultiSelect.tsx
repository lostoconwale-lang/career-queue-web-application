"use client";

import type { Route } from "next";
import Link from "next/link";

import { Check } from "@/app/_components/Icons";

export type ChipRef = { id: string; name: string };

type Props = {
  label: string;
  /** Active options to choose from. */
  options: ChipRef[];
  value: ChipRef[];
  onChange: (next: ChipRef[]) => void;
  /** Max selectable. The minimum is enforced by the caller and passed as `error`. */
  max: number;
  error?: string;
  /** Shown under the label. */
  hint?: string;
  /** "nothing to pick yet" state. */
  emptyText?: string;
  emptyHref?: Route;
  emptyLinkLabel?: string;
};

export function ChipMultiSelect({
  label,
  options,
  value,
  onChange,
  max,
  error,
  hint,
  emptyText,
  emptyHref,
  emptyLinkLabel,
}: Props) {
  const selected = new Set(value.map((v) => v.id));
  const atLimit = value.length >= max;

  function toggle(option: ChipRef) {
    if (selected.has(option.id)) {
      onChange(value.filter((v) => v.id !== option.id));
    } else if (value.length < max) {
      onChange([...value, { id: option.id, name: option.name }]);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-ink text-sm font-medium">
          {label} <span className="text-coral">*</span>
        </span>
        <span className={`text-xs tabular-nums ${atLimit ? "text-coral" : "text-muted"}`}>
          {value.length}/{max} selected
        </span>
      </div>
      {hint ? <p className="text-muted mt-0.5 text-xs">{hint}</p> : null}

      {options.length === 0 ? (
        <p className="text-muted mt-2 text-sm">
          {emptyText ?? "Nothing to pick yet."}{" "}
          {emptyHref ? (
            <Link href={emptyHref} className="text-brand font-semibold">
              {emptyLinkLabel ?? "Create one"}
            </Link>
          ) : null}
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((option) => {
            const on = selected.has(option.id);
            const disabled = !on && atLimit;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option)}
                disabled={disabled}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  on
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line text-muted hover:border-brand/40 hover:text-ink"
                } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {on ? <Check className="h-3.5 w-3.5" /> : null}
                {option.name}
              </button>
            );
          })}
        </div>
      )}

      {error ? <p className="text-coral mt-1.5 text-sm">{error}</p> : null}
    </div>
  );
}
