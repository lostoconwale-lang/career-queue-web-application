"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { City } from "../_data";
import { Check, Chevron, Pin } from "./Icons";

const ANY_CITY = "Any city";

export default function CitySelect({
  cities,
  value,
  onChange,
}: {
  cities: City[];
  value: string;
  onChange: (cityId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = cities.find((city) => city._id === value);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (cityId: string) => {
    onChange(cityId);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative sm:w-56">
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="hover:bg-cream flex w-full items-center gap-3 rounded-full px-4 py-3 text-left transition-colors"
      >
        <Pin className="text-muted h-5 w-5 shrink-0" />
        <span className={`flex-1 truncate text-base ${selected ? "text-ink" : "text-muted/70"}`}>
          {selected ? selected.name : ANY_CITY}
        </span>
        <Chevron
          className={`text-muted h-4 w-4 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="City"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-card border-line bg-surface shadow-lift absolute top-full left-0 z-50 mt-3 w-full min-w-56 origin-top border p-2"
          >
            {[{ _id: "", name: ANY_CITY }, ...cities].map((city) => {
              const isSelected = city._id === value;

              return (
                <li key={city._id || "any"} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => choose(city._id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-brand-soft text-brand font-semibold"
                        : "text-muted hover:bg-cream hover:text-ink font-medium"
                    }`}
                  >
                    {city.name}
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
