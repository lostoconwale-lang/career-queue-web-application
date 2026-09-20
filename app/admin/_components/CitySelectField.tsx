"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";

import { Pin, Refresh, Trash } from "@/app/_components/Icons";
import { CityPicker } from "@/app/admin/_components/CityPicker";
import type { CityDTO } from "@/types/city";

export type CityRef = { id: string; name: string };

type Props = {
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string;
  value: CityRef | null;
  onChange: (city: CityRef | null) => void;
  emptyHref?: Route;
};

export function CitySelectField({
  label = "City",
  hint,
  required,
  error,
  value,
  onChange,
  emptyHref = "/admin/cities",
}: Props) {
  const [picking, setPicking] = useState(false);

  function handlePick(city: CityDTO) {
    onChange({ id: city.id, name: city.name });
    setPicking(false);
  }

  return (
    <div>
      <span className="text-ink text-sm font-medium">
        {label}
        {required ? <span className="text-coral"> *</span> : null}
      </span>
      {hint ? <p className="text-muted mt-0.5 text-xs">{hint}</p> : null}

      {value ? (
        <div className="border-line mt-2 flex items-center gap-4 rounded-2xl border p-3">
          <span className="border-line bg-cream text-muted/50 grid h-11 w-11 shrink-0 place-items-center rounded-lg border">
            <Pin className="h-4 w-4" />
          </span>
          <p className="text-ink min-w-0 flex-1 truncate text-sm font-medium" title={value.name}>
            {value.name}
          </p>
          <button
            type="button"
            onClick={() => setPicking(true)}
            aria-label="Change city"
            title="Change"
            className="text-muted hover:bg-cream hover:text-ink rounded-lg p-1.5 transition-colors"
          >
            <Refresh className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove city"
            title="Remove"
            className="text-coral hover:bg-coral/10 rounded-lg p-1.5 transition-colors"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className={`mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            error
              ? "border-coral/60 text-coral bg-coral/5"
              : "border-line text-muted hover:border-brand/50 hover:bg-cream"
          }`}
        >
          <Pin className="h-9 w-9" />
          <span className="text-ink text-sm font-semibold">Choose a city</span>
          <span className="text-xs">Search the city directory</span>
        </button>
      )}

      {error ? <p className="text-coral mt-1.5 text-sm">{error}</p> : null}
      {!value ? (
        <p className="text-muted mt-1.5 text-xs">
          Don&apos;t see it?{" "}
          <Link href={emptyHref} className="text-brand font-semibold">
            Create a city
          </Link>
        </p>
      ) : null}

      {picking ? <CityPicker onClose={() => setPicking(false)} onPick={handlePick} /> : null}
    </div>
  );
}
