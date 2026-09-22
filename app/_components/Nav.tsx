"use client";

import { useEffect, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";

import { ConfirmDialog } from "./ConfirmDialog";
import Logo from "./Logo";
import { Arrow, ChevronRight, Close, LogOut, Menu, UserRound } from "./Icons";
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
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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

  function logout() {
    setSigningOut(true);
    void signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="sticky top-4 z-50 px-5 sm:px-8">
      <nav
        className={`mx-auto flex h-16 max-w-6xl items-center gap-6 rounded-full border px-5 backdrop-blur-md transition-all duration-300 sm:px-6 ${
          scrolled ? "border-line bg-surface/95 shadow-lift" : "border-line/60 bg-surface/85 shadow-soft"
        }`}
      >
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
          {isAuthenticated ? (
            <AccountMenu onLogout={() => setConfirmingLogout(true)} />
          ) : (
            <>
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
            </>
          )}
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
              className="border-line bg-surface/95 shadow-lift absolute inset-x-5 top-full z-40 mt-2 origin-top overflow-hidden rounded-3xl border backdrop-blur-md sm:inset-x-8 md:hidden"
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
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={close}
                      className="from-brand to-coral text-surface shadow-soft flex flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-r py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                    >
                      <UserRound className="h-4 w-4" />
                      Your profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        setConfirmingLogout(true);
                      }}
                      className="border-line text-coral hover:bg-coral/10 flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmingLogout}
        tone="danger"
        busy={signingOut}
        title="Log out?"
        description="You'll need to log in again to continue."
        confirmLabel="Log out"
        onConfirm={logout}
        onCancel={() => setConfirmingLogout(false)}
      />
    </header>
  );
}

function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="border-line bg-surface text-ink hover:border-brand/40 grid h-11 w-11 place-items-center rounded-full border transition-colors"
      >
        <UserRound className="h-5 w-5" />
      </button>

      {open ? (
        // `pt-2` bridges the visual gap so hovering button → menu doesn't close it.
        <div className="absolute top-full right-0 pt-2">
          <div
            role="menu"
            className="border-line bg-surface shadow-lift w-48 rounded-2xl border p-1.5"
          >
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="text-ink hover:bg-cream flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <UserRound className="h-4 w-4" />
              Your profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="text-coral hover:bg-coral/10 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
