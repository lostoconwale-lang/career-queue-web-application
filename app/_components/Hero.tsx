"use client";

import Image from "next/image";

import type { PublicHeroDTO } from "@/types/public-hero";
import HeroSearch from "./HeroSearch";
import JobCardMockup from "./JobCardMockup";
import { Sparkle, Squiggle } from "./Icons";

// Only 3 floating positions are laid out — see HERO_JOB_CARDS_LIMIT.
const floatPositions = [
  "top-40 left-2 -rotate-6",
  "top-24 right-2 rotate-6",
  "bottom-16 right-10 -rotate-3",
];

export default function Hero({ content }: { content: PublicHeroDTO }) {
  const jobCards = content.jobCards.map((c) => ({
    company: c.companyName,
    logo: c.logoUrl,
    title: c.jobTitle,
    tags: c.tags,
    salary: c.salary,
    href: c.jobId ? `/jobs/${c.jobId}` : null,
  }));

  return (
    // overflow-x-clip (not overflow-hidden) contains the floating cards and
    // background bleed horizontally without trapping the city dropdown, which
    // needs to overflow the section vertically.
    <section id="top" className="relative overflow-x-clip pb-24">
      <div className="pointer-events-none absolute inset-x-0 -top-16 bottom-0 z-0">
        <Image
          src="/images/hero-bg-texture.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 mx-auto hidden max-w-[1500px] xl:block">
        {jobCards.slice(0, floatPositions.length).map((job, index) => (
          <div
            key={job.company}
            className={`animate-float absolute w-64 ${floatPositions[index]}`}
            style={{ animationDelay: `${index * 1.4}s` }}
          >
            <JobCardMockup job={job} />
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-4xl px-5 pt-16 text-center sm:px-8 sm:pt-24">
        <p className="border-line bg-surface/80 text-muted inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
          <Sparkle className="text-coral h-3.5 w-3.5" />
          {content.badgeText}
        </p>

        <h1 className="font-display text-ink mt-8 tracking-tight">
          <span className="block text-5xl leading-[0.95] font-semibold sm:text-6xl lg:text-7xl">
            {content.headlineLine1}
          </span>
          <span className="mt-2 block text-4xl leading-[1.05] font-light italic sm:text-5xl lg:text-6xl">
            <span className="text-brand inline-block -rotate-2">{content.headlineLine2}</span>
          </span>
          <span className="mt-3 block text-3xl leading-tight font-normal sm:text-4xl lg:text-5xl">
            {content.headlineLine3}{" "}
            <span className="relative inline-block rotate-1">
              {content.headlineHighlight}
              <Squiggle className="text-coral absolute -bottom-2 left-0 h-2.5 w-full" />
            </span>
          </span>
        </h1>

        <p className="text-muted mx-auto mt-8 max-w-xl text-lg leading-relaxed">
          {content.subtext}
        </p>

        <div className="mx-auto mt-10 max-w-3xl">
          <HeroSearch quickFilters={content.quickFilters} />
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {content.avatars.length > 0 ? (
            <ul className="flex -space-x-3">
              {content.avatars.map((avatar, index) => (
                <li key={index}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatar}
                    alt=""
                    width={40}
                    height={40}
                    className="border-surface bg-brand-soft h-10 w-10 rounded-full border-2 object-cover"
                  />
                </li>
              ))}
              <li className="border-surface bg-ink text-surface grid h-10 w-10 place-items-center rounded-full border-2 text-xs font-semibold">
                +
              </li>
            </ul>
          ) : null}
          <p className="text-muted text-sm">{content.trustText}</p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3 xl:hidden">
          {jobCards.map((job, index) => (
            <div key={job.company} className={`mx-auto ${index === 1 ? "rotate-2" : "-rotate-2"}`}>
              <JobCardMockup job={job} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
