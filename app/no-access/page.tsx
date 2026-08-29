import Link from "next/link";

const FORBIDDEN = {
  title: "You don't have permission",
  body: "Your account doesn't have access to this area. If your admin access was recently removed or is still awaiting approval, that's why. Reach out to another admin if you think this is a mistake.",
};

const REASONS: Record<string, { title: string; body: string }> = {
  "401": {
    title: "Your session has ended",
    body: "You've been signed out — this can happen after a while, or if your access changed. Log in again to pick up where you left off.",
  },
  "403": FORBIDDEN,
};

export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const reason = REASONS[code ?? ""] ?? FORBIDDEN;

  return (
    <main className="bg-cream flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <LockIllustration className="h-44 w-44" />

      <h1 className="font-display text-ink mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
        {reason.title}
      </h1>
      <p className="text-muted mt-3 max-w-md text-sm sm:text-base">{reason.body}</p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/admin/login"
          className="bg-brand text-surface shadow-soft inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          Go to login
        </Link>
        <Link
          href="/"
          className="border-line text-ink hover:bg-surface inline-flex items-center justify-center rounded-full border px-7 py-3.5 text-sm font-semibold transition-colors"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}

function LockIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden className={className}>
      <circle cx="100" cy="100" r="92" className="fill-brand-soft" />
      <circle
        cx="100"
        cy="100"
        r="92"
        className="stroke-brand/30"
        strokeWidth="3"
        strokeDasharray="6 12"
        strokeLinecap="round"
      />
      <rect x="55" y="92" width="90" height="72" rx="16" className="fill-surface stroke-ink/80" strokeWidth="5" />
      <path
        d="M72 92V74a28 28 0 0 1 56 0v18"
        className="stroke-ink/80"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="100" cy="122" r="10" className="fill-brand" />
      <path d="M100 130v16" className="stroke-brand" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
