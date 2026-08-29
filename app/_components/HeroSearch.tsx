"use client";

import { useState } from "react";

import { cities, quickFilters } from "../_data";
import CitySelect from "./CitySelect";
import { SearchGlass } from "./Icons";

export default function HeroSearch() {
  const [role, setRole] = useState("");
  const [cityId, setCityId] = useState("");

  return (
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          console.log("search", { role, cityId });
        }}
        className="border-line bg-surface shadow-soft flex flex-col gap-2 rounded-3xl border p-2 sm:flex-row sm:items-center sm:rounded-full sm:p-2.5"
      >
        <label className="flex flex-1 items-center gap-3 px-4 py-3">
          <SearchGlass className="text-muted h-5 w-5 shrink-0" />
          <span className="sr-only">Role or keyword</span>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Product designer, backend, growth…"
            className="text-ink placeholder:text-muted/70 w-full bg-transparent text-base outline-none"
          />
        </label>

        <span className="bg-line mx-4 h-px sm:mx-0 sm:h-8 sm:w-px" />

        <CitySelect cities={cities} value={cityId} onChange={setCityId} />

        <button
          type="submit"
          className="bg-brand text-surface shadow-soft rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Find Jobs
        </button>
      </form>

      <ul className="mt-5 flex flex-wrap justify-center gap-2">
        {quickFilters.map((filter) => (
          <li key={filter}>
            <button
              type="button"
              onClick={() => setRole(filter)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                role === filter
                  ? "border-brand bg-brand text-surface"
                  : "border-line bg-surface/70 text-muted hover:border-brand/40 hover:bg-brand-soft hover:text-ink"
              }`}
            >
              {filter}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
