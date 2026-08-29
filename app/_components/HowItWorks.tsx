import Image from "next/image";

import { steps } from "../_data";
import { Arrow } from "./Icons";
import Reveal from "./Reveal";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="text-center">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">How it works</p>
        <h2 className="font-display text-ink mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-4xl leading-[1.1] font-semibold tracking-tight sm:gap-x-7 sm:text-6xl">
          <span>Search</span>
          <Arrow className="text-coral h-6 w-6 shrink-0 sm:h-9 sm:w-9" strokeWidth={2.2} />
          <span>Match</span>
          <Arrow className="text-coral h-6 w-6 shrink-0 sm:h-9 sm:w-9" strokeWidth={2.2} />
          <span>Apply</span>
        </h2>
        <p className="text-muted mx-auto mt-6 max-w-lg text-lg">
          Three steps, about ten minutes, and no cover letter until you actually want the job.
        </p>
      </Reveal>

      <ol className="mt-16 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <Reveal key={step.word} delay={index * 0.1}>
            <li className="rounded-card border-line bg-surface shadow-soft h-full border p-8">
              <div className="flex items-center justify-between">
                <span className="bg-brand-soft font-display text-brand grid h-11 w-11 place-items-center rounded-full text-xl font-semibold">
                  {index + 1}
                </span>
                <Image
                  src={step.image}
                  alt=""
                  width={512}
                  height={512}
                  className="h-20 w-20 object-contain"
                />
              </div>
              <h3 className="text-ink mt-6 text-xl leading-snug font-semibold">{step.title}</h3>
              <p className="text-muted mt-3 leading-relaxed">{step.body}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
