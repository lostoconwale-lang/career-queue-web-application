import Image from "next/image";

import { features } from "../_data";
import { Check } from "./Icons";
import Reveal from "./Reveal";

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="max-w-2xl">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">What you get</p>
        <h2 className="font-display text-ink mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
          Built for the part of job hunting{" "}
          <span className="text-brand font-light italic">everyone hates</span>
        </h2>
      </Reveal>

      <div className="mt-16 space-y-20 sm:space-y-28">
        {features.map((feature, index) => (
          <Reveal key={feature.eyebrow}>
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <p className="text-coral text-sm font-semibold tracking-[0.14em] uppercase">
                  {feature.eyebrow}
                </p>
                <h3 className="font-display text-ink mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                  {feature.title}
                </h3>
                <p className="text-muted mt-5 text-lg leading-relaxed">{feature.body}</p>
                <ul className="mt-7 space-y-3">
                  {feature.points.map((point) => (
                    <li key={point} className="text-ink flex items-center gap-3">
                      <span className="bg-brand-soft text-brand grid h-6 w-6 shrink-0 place-items-center rounded-full">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`rounded-frame border-line bg-surface shadow-soft overflow-hidden border ${
                  index % 2 === 1 ? "lg:order-1" : ""
                }`}
              >
                <div className="border-line flex items-center gap-2 border-b px-5 py-3.5">
                  <span className="bg-coral/60 h-2.5 w-2.5 rounded-full" />
                  <span className="bg-line h-2.5 w-2.5 rounded-full" />
                  <span className="bg-line h-2.5 w-2.5 rounded-full" />
                  <span className="bg-cream ml-3 h-5 flex-1 rounded-full" />
                </div>
                <div className="from-brand-soft/70 via-cream to-cream bg-linear-to-br p-6 sm:p-10">
                  <Image
                    src={feature.image}
                    alt=""
                    width={1024}
                    height={768}
                    className="mx-auto h-56 w-full object-contain sm:h-72"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
