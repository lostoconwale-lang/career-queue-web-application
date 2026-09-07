import Image from "next/image";

import { heroJobCards } from "../_data";
import HeroSearch from "./HeroSearch";
import JobCardMockup from "./JobCardMockup";
import { Sparkle, Squiggle } from "./Icons";

const avatars = ["/images/avatar-1.png", "/images/avatar-2.png", "/images/avatar-3.png"];

const floatPositions = [
  "top-40 left-2 -rotate-6",
  "top-24 right-2 rotate-6",
  "bottom-16 right-10 -rotate-3",
];

export default function Hero() {
  return (
    // overflow-x-clip (not overflow-hidden) contains the floating cards and
    // background bleed horizontally without trapping the city dropdown, which
    // needs to overflow the section vertically.
    <section id="top" className="relative overflow-x-clip pb-24">
      <Image
        src="/images/hero-bg-texture.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none z-0 object-cover"
      />

      <div className="pointer-events-none absolute inset-0 mx-auto hidden max-w-[1500px] xl:block">
        {heroJobCards.map((job, index) => (
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
          Now matching 12,400 open roles
        </p>

        <h1 className="font-display text-ink mt-8 tracking-tight">
          <span className="block text-5xl leading-[0.95] font-semibold sm:text-6xl lg:text-7xl">
            Great careers
          </span>
          <span className="mt-2 block text-4xl leading-[1.05] font-light italic sm:text-5xl lg:text-6xl">
            <span className="text-brand inline-block -rotate-2">&amp; great teams</span>
          </span>
          <span className="mt-3 block text-3xl leading-tight font-normal sm:text-4xl lg:text-5xl">
            don&apos;t happen by{" "}
            <span className="relative inline-block rotate-1">
              accident
              <Squiggle className="text-coral absolute -bottom-2 left-0 h-2.5 w-full" />
            </span>
          </span>
        </h1>

        <p className="text-muted mx-auto mt-8 max-w-xl text-lg leading-relaxed">
          We match people to jobs that actually fit — the team, the pay, the pace — instead of
          whatever got posted most recently.
        </p>

        <div className="mx-auto mt-10 max-w-3xl">
          <HeroSearch />
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <ul className="flex -space-x-3">
            {avatars.map((avatar) => (
              <li key={avatar}>
                <Image
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
          <p className="text-muted text-sm">Trusted by job seekers at 500+ companies</p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3 xl:hidden">
          {heroJobCards.map((job, index) => (
            <div key={job.company} className={`mx-auto ${index === 1 ? "rotate-2" : "-rotate-2"}`}>
              <JobCardMockup job={job} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
