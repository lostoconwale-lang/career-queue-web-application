"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import Logo from "./Logo";
import { Arrow, ChevronRight, Close, Menu, UserRound } from "./Icons";
import type { PublicHeaderLinkDTO } from "@/types/public-header";

const panelVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.035 * i + 0.05, duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

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
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close automatically if the viewport grows past the mobile breakpoint —
  // the trigger button that opens it disappears there, so a stale open state
  // would otherwise leave body scroll locked with nothing visible to close it.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-line bg-surface/90 border-b backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Home" className="cursor-pointer">
          <Logo iconUrl={iconUrl} siteName={siteName} />
        </Link>

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

        <div className="ml-auto hidden items-center gap-2 md:flex">
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
            Register
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="border-line bg-surface shadow-soft text-ink hover:border-brand/40 active:scale-95 ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-all md:hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={menuOpen ? "close" : "menu"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid place-items-center"
            >
              {menuOpen ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-ink/20 fixed inset-0 z-40 backdrop-blur-[2px] md:hidden"
            />
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="border-line bg-surface/95 shadow-lift absolute inset-x-4 top-full z-40 mt-2 origin-top overflow-hidden rounded-3xl border backdrop-blur-md sm:inset-x-8 md:hidden"
            >
              {visibleLinks.length > 0 ? (
                <ul className="flex flex-col gap-0.5 p-2">
                  {visibleLinks.map((link, i) => (
                    <motion.li key={link.href} custom={i} variants={itemVariants}>
                      <Link
                        href={link.href as Route}
                        onClick={close}
                        className="text-ink hover:bg-brand-soft hover:text-brand flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                      >
                        {link.label}
                        <ChevronRight className="text-muted h-4 w-4 shrink-0" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              ) : null}

              <motion.div
                custom={visibleLinks.length}
                variants={itemVariants}
                className="border-line flex items-center gap-2.5 border-t p-3"
              >
                <Link
                  href="/login"
                  onClick={close}
                  className="border-line text-ink hover:bg-cream flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-colors"
                >
                  <UserRound className="h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="from-brand to-coral text-surface shadow-soft flex flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-r py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                >
                  Register
                  <Arrow className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
