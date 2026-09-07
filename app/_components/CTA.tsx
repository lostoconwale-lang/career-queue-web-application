import Link from "next/link";

import { Arrow, Sparkle } from "./Icons";
import Reveal from "./Reveal";

export default function CTA() {
  return (
    <section className="bg-brand-soft rounded-t-[40px] px-5 py-24 sm:rounded-t-[64px] sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Sparkle className="text-coral mx-auto h-7 w-7" />
        <h2 className="font-display text-ink mt-8 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
          Let&apos;s find your{" "}
          <span className="text-brand inline-block -rotate-2 font-light italic">next role</span>
        </h2>
        <p className="text-muted mx-auto mt-6 max-w-md text-lg">
          Tell us what a good job looks like to you. We&apos;ll do the digging — free, forever.
        </p>
        <Link
          href="/jobs"
          className="group bg-ink text-surface shadow-lift mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold transition-transform hover:-translate-y-0.5"
        >
          Start matching
          <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </section>
  );
}
