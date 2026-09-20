import type { ComponentType } from "react";
import type { Route } from "next";
import Link from "next/link";

import { listPublicSettings } from "@/lib/services/public-settings.service";
import { listPublicFooter } from "@/lib/services/public-footer.service";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/types/settings";
import { Facebook, Instagram, LinkedIn, XLogo, YouTube } from "./Icons";
import Logo from "./Logo";

const SOCIAL_ICONS: Record<SocialPlatform, ComponentType<{ className?: string }>> = {
  youtube: YouTube,
  linkedin: LinkedIn,
  x: XLogo,
  instagram: Instagram,
  facebook: Facebook,
};

export default async function Footer() {
  const [{ siteName, iconDarkUrl, tagline, socialLinks }, sections] = await Promise.all([
    listPublicSettings(),
    listPublicFooter(),
  ]);

  return (
    <footer className="bg-brand-soft px-5 pb-14 sm:px-8">
      <div className="border-brand/10 mx-auto grid max-w-6xl gap-12 border-t pt-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="/" aria-label="Home" className="w-fit cursor-pointer">
            <Logo iconUrl={iconDarkUrl} siteName={siteName} />
          </Link>
          {tagline ? <p className="text-muted mt-4 max-w-xs leading-relaxed">{tagline}</p> : null}
          {socialLinks.length > 0 ? (
            <ul className="mt-6 flex gap-3">
              {socialLinks.map(({ platform, url }) => {
                const Icon = SOCIAL_ICONS[platform];
                return (
                  <li key={platform}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={SOCIAL_PLATFORM_LABELS[platform]}
                      className="border-brand/15 bg-surface text-muted hover:text-brand grid h-10 w-10 place-items-center rounded-full border transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {sections.map((section) => (
          <div key={section.heading}>
            <h3 className="text-ink text-sm font-semibold tracking-[0.14em] uppercase">
              {section.heading}
            </h3>
            {section.links.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href as Route}
                      className="text-muted hover:text-brand transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <p className="text-muted mx-auto mt-12 max-w-6xl text-sm">
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </p>
    </footer>
  );
}
