"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import Logo from "@/app/_components/Logo";
import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import {
  Activity,
  Briefcase,
  Buildings,
  Chevron,
  Clock,
  Close,
  Cog,
  FileText,
  Gauge,
  LogOut,
  Mail,
  Menu,
  Photo,
  Pin,
  QuestionMark,
  Quote,
  ShieldCheck,
  Tag,
  UserRound,
  UsersRound,
} from "@/app/_components/Icons";

type Icon = ComponentType<{ className?: string }>;
type NavLink = { label: string; href: Route; icon: Icon };
type NavGroup = { label: string; icon: Icon; children: NavLink[] };
type NavEntry = NavLink | NavGroup;

const NAV: NavEntry[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Gauge },
  { label: "Users", href: "/admin/users", icon: UsersRound },
  { label: "Cities", href: "/admin/cities", icon: Pin },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Job types", href: "/admin/job-types", icon: Clock },
  { label: "Companies", href: "/admin/companies", icon: Buildings },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { label: "Applications", href: "/admin/applications", icon: Mail },
  { label: "Testimonials", href: "/admin/testimonials", icon: Quote },
  { label: "FAQs", href: "/admin/faqs", icon: QuestionMark },
  { label: "Pages", href: "/admin/static-pages", icon: FileText },
  { label: "Media", href: "/admin/media", icon: Photo },
  {
    label: "Admins",
    icon: ShieldCheck,
    children: [
      { label: "Users", href: "/admin/admins/users", icon: UsersRound },
      { label: "Activity logs", href: "/admin/admins/activity", icon: Activity },
    ],
  },
  { label: "Settings", href: "/admin/settings", icon: Cog },
];

export function AdminShell({ name, children }: { name: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function logout() {
    setSigningOut(true);
    void signOut({ callbackUrl: "/admin/login" });
  }

  return (
    <div className="bg-cream min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      {/* Mobile drawer backdrop */}
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="bg-ink/30 fixed inset-0 z-30 lg:hidden"
        />
      ) : null}

      <aside
        className={`border-line bg-surface fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r px-5 py-6 transition-transform lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="text-muted hover:text-ink lg:hidden"
          >
            <Close className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((entry) =>
            "children" in entry ? (
              <NavGroupItem
                key={entry.label}
                group={entry}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            ) : (
              <NavItem
                key={entry.href}
                link={entry}
                active={pathname.startsWith(entry.href)}
                onNavigate={() => setOpen(false)}
              />
            ),
          )}
        </nav>

        <button
          type="button"
          onClick={() => setConfirmingLogout(true)}
          className="text-coral hover:bg-coral/10 mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="border-line bg-surface/80 sticky top-0 z-20 flex items-center gap-3 border-b px-5 py-3 backdrop-blur sm:px-8">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="text-muted hover:text-ink lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <ProfileMenu name={name} onLogout={() => setConfirmingLogout(true)} />
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <ConfirmDialog
        open={confirmingLogout}
        tone="danger"
        busy={signingOut}
        title="Sign out?"
        description="You'll need to log in again to access the admin panel."
        confirmLabel="Sign out"
        onConfirm={logout}
        onCancel={() => setConfirmingLogout(false)}
      />
    </div>
  );
}

function NavGroupItem({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  const hasActiveChild = group.children.some((c) => pathname.startsWith(c.href));
  // Open by default whenever a child route is active; a manual toggle overrides.
  const [override, setOverride] = useState<boolean | null>(null);
  const open = override ?? hasActiveChild;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOverride(!open)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          hasActiveChild ? "text-ink" : "text-muted hover:bg-cream hover:text-ink"
        }`}
      >
        <group.icon className="h-5 w-5" />
        {group.label}
        <Chevron className={`ml-auto h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>

      {open ? (
        <div className="border-line mt-1 ml-[1.55rem] flex flex-col gap-1 border-l pt-1 pl-2">
          {group.children.map((child) => (
            <NavItem
              key={child.href}
              link={child}
              active={pathname.startsWith(child.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavItem({
  link,
  active,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-brand-soft text-brand" : "text-muted hover:bg-cream hover:text-ink"
      }`}
    >
      <link.icon className="h-5 w-5" />
      {link.label}
    </Link>
  );
}

function ProfileMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = name.trim().charAt(0).toUpperCase() || "A";

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
      className="relative ml-auto"
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
        className="bg-brand text-surface grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
      >
        {initial}
      </button>

      {open ? (
        // `pt-2` bridges the visual gap so hovering button → menu doesn't close it.
        <div className="absolute top-full right-0 pt-2">
          <div
            role="menu"
            className="border-line bg-surface shadow-lift w-56 rounded-2xl border p-1.5"
          >
            <div className="px-3 py-2">
              <p className="text-muted text-xs">Signed in as</p>
              <p className="text-ink truncate text-sm font-semibold">{name}</p>
            </div>
            <div className="bg-line mx-1 my-1 h-px" />
            <Link
              href="/admin/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="text-ink hover:bg-cream flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <UserRound className="h-4 w-4" />
              My profile
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
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
