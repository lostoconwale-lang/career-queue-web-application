import Link from "next/link";

import { jobCategories } from "../_data";
import { Arrow } from "./Icons";
import Reveal from "./Reveal";

export default function JobCategories() {
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
        {jobCategories.map((category, index) => (
          <Reveal key={category._id} delay={index * 0.05}>
            <Link
              href={`/jobs?categories=${category._id}`}
              className="group rounded-card border-line bg-surface shadow-soft hover:border-brand/30 hover:shadow-lift flex h-full items-center justify-between gap-3 border p-6 transition-all duration-300 hover:-translate-y-1"
            >
              <span>
                <span className="font-display text-ink block text-xl leading-snug font-semibold">
                  {category.name}
                </span>
                <span className="text-muted mt-1 block text-sm">
                  {category.openRoles.toLocaleString()} open roles
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
