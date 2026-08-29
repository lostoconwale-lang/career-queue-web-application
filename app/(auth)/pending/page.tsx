import Link from "next/link";

// Shown right after sign-up / first Google sign-in. Accounts stay here until an
// admin approves them.
export default function PendingPage() {
  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        Almost <span className="text-brand font-light italic">there</span>
      </h1>
      <p className="text-muted mt-3">
        Your account has been created and is waiting for an admin to approve it. We&apos;ll email
        you as soon as it&apos;s ready — then you can log in.
      </p>

      <Link
        href="/"
        className="bg-brand text-surface shadow-soft mt-8 inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5"
      >
        Continue
      </Link>
    </div>
  );
}
