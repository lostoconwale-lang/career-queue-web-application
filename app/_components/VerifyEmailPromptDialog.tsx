"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Purely informational — the server already resent the verification link the
// moment login was blocked (see auth.service.ts verifyCredentials), so there's
// nothing to submit here, just somewhere to tell the user to go check.
export function VerifyEmailPromptDialog({ open, onClose }: Props) {
  if (!open) return null;
  return <VerifyEmailPromptDialogContent onClose={onClose} />;
}

function VerifyEmailPromptDialogContent({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-email-title"
        className="bg-surface shadow-lift relative w-full max-w-sm rounded-3xl p-6"
      >
        <h2 id="verify-email-title" className="font-display text-ink text-xl font-semibold">
          Verify your email
        </h2>
        <p className="text-muted mt-2 text-sm">
          Your email address hasn&apos;t been confirmed yet. We&apos;ve just sent a fresh
          verification link — open it, then come back and log in.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-brand text-surface rounded-full px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
