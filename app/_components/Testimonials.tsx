import Image from "next/image";

import { testimonials } from "../_data";
import Reveal from "./Reveal";

export default function Testimonials() {
  return (
    <section className="overflow-hidden py-24 sm:py-32">
      <Reveal className="mx-auto max-w-6xl px-5 text-center sm:px-8">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">
          People who moved
        </p>
        <h2 className="font-display text-ink mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
          Offers, not <span className="text-brand font-light italic">open tabs</span>
        </h2>
      </Reveal>

      <div className="group relative mt-14 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ul className="animate-marquee flex w-max gap-5 pr-5 group-hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <li
              key={`${testimonial.name}-${index}`}
              className="rounded-card border-line bg-surface shadow-soft w-80 shrink-0 border p-7"
            >
              <p className="text-ink leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <Image
                  src={testimonial.avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="bg-brand-soft h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-ink text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-muted text-sm">{testimonial.role}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
