"use client";

import Link from "next/link";

import type { PublicPopularCategoryDTO } from "@/types/public-popular-categories";
import { Arrow, Tag } from "./Icons";
import Reveal from "./Reveal";

export default function JobCategories({
  categories,
}: {
  categories: PublicPopularCategoryDTO[];
}) {
  if (categories.length === 0) return null;

  return (
    <section id="categories" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="text-center">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">
          Popular job categories
        </p>
        <h2 className="font-display text-ink mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
          Where people are <span className="text-brand font-light italic">getting hired</span>
        </h2>
      </Reveal>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category, index) => (
          <Reveal key={category.id} delay={index * 0.05}>
            <Link
              href={`/jobs?categories=${category.id}`}
              className="group rounded-card border-line bg-surface shadow-soft hover:border-brand/30 hover:shadow-lift flex h-full items-center justify-between gap-3 border p-6 transition-all duration-300 hover:-translate-y-1"
            >
              <span className="flex min-w-0 items-center gap-3.5">
                {category.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.iconUrl}
                    alt=""
                    className="border-line bg-cream h-11 w-11 shrink-0 rounded-xl border object-contain p-1.5"
                  />
                ) : (
                  <span className="border-line bg-cream text-muted/50 grid h-11 w-11 shrink-0 place-items-center rounded-xl border">
                    <Tag className="h-4.5 w-4.5" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="font-display text-ink block truncate text-xl leading-snug font-semibold">
                    {category.name}
                  </span>
                  <span className="text-muted mt-1 block text-sm">
                    {category.openRoles.toLocaleString()} open roles
                  </span>
                </span>
              </span>
              <span className="bg-brand-soft text-brand grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5">
                <Arrow className="h-4 w-4" />
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
