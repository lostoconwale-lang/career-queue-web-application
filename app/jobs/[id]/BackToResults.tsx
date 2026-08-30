"use client";

import { useRouter } from "next/navigation";

import { ChevronLeft } from "@/app/_components/Icons";

// Uses the browser history entry pushed by the listing page's `<Link>`, so the
// exact prior search/filter/page/view state (all URL query params) comes back
// intact. Falls back to a plain navigation if there's no history to pop (e.g.
// this page was opened directly).
export function BackToResults() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/jobs");
      }}
      className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
    >
      <ChevronLeft className="h-4 w-4" />
      Back to results
    </button>
  );
}
