"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { Eye, EyeOff } from "./Icons";

type Props = {
  label: string;
  name: string;
  trailing?: ReactNode;
  prefix?: ReactNode;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const base =
  "w-full border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function AuthField({ label, name, trailing, prefix, error, type = "text", ...rest }: Props) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  const inputClass = [
    base,
    prefix != null ? "rounded-r-2xl" : "rounded-2xl",
    isPassword ? "pr-12" : "",
    error ? "border-coral focus:border-coral focus:ring-coral/10" : "",
  ].join(" ");

  return (
    <label className="block">
      <span className="text-ink flex items-center justify-between text-sm font-medium">
        {label}
        {trailing}
      </span>
      <div className="relative mt-2 flex">
        {prefix != null ? (
          <span className="border-line bg-cream text-muted flex items-center rounded-l-2xl border border-r-0 px-3.5 text-sm font-medium">
            {prefix}
          </span>
        ) : null}
        <input
          id={name}
          name={name}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={error ? true : undefined}
          className={inputClass}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="text-muted hover:bg-cream hover:text-ink absolute top-1/2 right-2.5 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full transition-colors"
          >
            {reveal ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-coral mt-1.5 text-sm">{error}</p> : null}
    </label>
  );
}
