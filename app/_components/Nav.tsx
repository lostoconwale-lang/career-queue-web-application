"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";

import Logo from "./Logo";
import type { PublicHeaderLinkDTO } from "@/types/public-header";

export default function Nav({
  iconUrl,
  siteName,
  links = [],
  isAuthenticated = false,
}: {
  iconUrl?: string | null;
  siteName?: string;
  links?: PublicHeaderLinkDTO[];
  isAuthenticated?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const visibleLinks = links.filter(
    (link) =>
      link.visibility === "all" ||
      (link.visibility === "auth" && isAuthenticated) ||
      (link.visibility === "guest" && !isAuthenticated),
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-line bg-surface/90 border-b backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-5 py-4 sm:px-8">
        <a href="#top" aria-label="Home">
          <Logo iconUrl={iconUrl} siteName={siteName} />
        </a>

        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href as Route}
                className="text-muted hover:bg-brand-soft hover:text-ink rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/login"
            className="text-muted hover:text-ink rounded-full px-4 py-2 text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-ink text-surface shadow-soft rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
