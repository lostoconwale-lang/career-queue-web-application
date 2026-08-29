"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Logo from "./Logo";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Categories", href: "#categories" },
  { label: "What you get", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

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
        <a href="#top" aria-label="CareerQueue home">
          <Logo />
        </a>

        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-muted hover:bg-brand-soft hover:text-ink rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
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
