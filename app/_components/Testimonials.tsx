"use client";

import { useEffect, useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { PublicTestimonialDTO } from "@/types/public-testimonial";
import Reveal from "./Reveal";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<PublicTestimonialDTO[]>([]);

  // Active testimonials — cached + tag-revalidated on the server
  // (/api/v1/public/testimonials), refreshed whenever an admin edits the list.
  useEffect(() => {
    let alive = true;
    fetch("/api/v1/public/testimonials")
      .then((res) => res.json() as Promise<ApiResponse<PublicTestimonialDTO[]>>)
      .then((json) => {
        if (alive && json.success) setTestimonials(json.data);
      })
      .catch(() => {
        // A failed fetch just leaves the section empty — nothing to surface.
      });
    return () => {
      alive = false;
    };
  }, []);

  if (testimonials.length === 0) return null;

  // The marquee loops seamlessly by rendering the track twice and translating
  // it -50% (see `--animate-marquee`). For that to stay gapless, one copy of
  // the track must be wider than the viewport — with the wide desktop cards and
  // only a handful of testimonials that isn't guaranteed, so pad each copy out
  // to at least 6 cards first.
  const oneLoop =
    testimonials.length >= 6
      ? testimonials
      : Array.from({ length: Math.ceil(6 / testimonials.length) }, () => testimonials).flat();
  const track = [...oneLoop, ...oneLoop];

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
        <ul className="animate-marquee flex w-max gap-5 pr-5 group-hover:[animation-play-state:paused] lg:gap-6">
          {track.map((testimonial, index) => (
            <li
              key={index}
              className="rounded-card border-line bg-surface shadow-soft flex w-[80vw] shrink-0 flex-col border p-7 sm:w-[46vw] lg:w-[calc((100vw-5rem)/3)] lg:p-9 xl:w-[calc((100vw-7rem)/3)]"
            >
              <p className="text-ink text-lg leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3 pt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={testimonial.imageUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="bg-brand-soft h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-ink text-sm font-semibold">{testimonial.authorName}</p>
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
