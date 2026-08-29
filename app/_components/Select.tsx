"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Check, Chevron } from "./Icons";

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  className?: string;
};

export function Select({ value, onChange, options, ariaLabel, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const optionButtons = () =>
    Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? []);

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
    const index = Math.max(
      0,
      options.findIndex((o) => o.value === value),
    );
    optionButtons()[index]?.focus();
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, options, value]);

  function onListKeyDown(event: ReactKeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = optionButtons();
    const current = items.findIndex((el) => el === document.activeElement);
    const next =
      event.key === "ArrowDown"
        ? Math.min(items.length - 1, current + 1)
        : Math.max(0, current - 1);
    items[next]?.focus();
  }

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="border-line bg-surface text-ink hover:border-brand/40 focus:border-brand focus:ring-brand/10 flex w-full items-center gap-2 rounded-full border py-2.5 pr-3 pl-4 text-sm font-medium transition-colors outline-none focus:ring-4"
      >
        <span className="flex-1 truncate text-left">{selected?.label}</span>
        <Chevron
          className={`text-muted h-4 w-4 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel}
            onKeyDown={onListKeyDown}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="border-line bg-surface shadow-lift absolute top-full left-0 z-50 mt-2 w-full min-w-48 origin-top rounded-2xl border p-1.5"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(option.value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-brand-soft text-brand font-semibold"
                      : "text-muted hover:bg-cream hover:text-ink font-medium"
                  }`}
                >
                  {option.label}
                  {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
