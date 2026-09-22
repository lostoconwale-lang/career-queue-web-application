"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { OtpInput } from "@/app/_components/OtpInput";

type Identifier = { email?: string; phone?: { countryCode: string; number: string } };

type Props = {
  open: boolean;
  identifier: Identifier;
  onClose: () => void;
  onVerified: () => void;
};

// The server already sent a fresh code the moment login was blocked (see
// auth.service.ts verifyCredentials), so this only needs to collect it.
export function VerifyPhoneDialog({ open, identifier, onClose, onVerified }: Props) {
  if (!open) return null;
  return (
    <VerifyPhoneDialogContent identifier={identifier} onClose={onClose} onVerified={onVerified} />
  );
}

function VerifyPhoneDialogContent({
  identifier,
  onClose,
  onVerified,
}: {
  identifier: Identifier;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !verifying) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [verifying, onClose]);

  async function verify(code: string) {
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/v1/auth/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identifier, otp: code }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (json.success) {
        onVerified();
      } else {
        setError(json.error?.message ?? "That code is incorrect or has expired");
        setOtp("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setOtp("");
    } finally {
      setVerifying(false);
    }
  }

  // Auto-submits the moment all 4 digits are entered — no extra tap needed.
  function handleOtpChange(next: string) {
    setOtp(next);
    if (next.length === 4 && !verifying) void verify(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}$/.test(otp)) {
      setError("Enter the 4-digit code");
      return;
    }
    void verify(otp);
  }

  async function handleResend() {
    setResending(true);
    setOtp("");
    setError(null);
    try {
      await fetch("/api/v1/auth/resend-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(identifier),
      });
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={() => !verifying && onClose()}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-phone-title"
        className="bg-surface shadow-lift relative w-full max-w-sm rounded-3xl p-6"
      >
        <h2 id="verify-phone-title" className="font-display text-ink text-xl font-semibold">
          Verify your phone
        </h2>
        <p className="text-muted mt-2 text-sm">
          Your mobile number hasn&apos;t been confirmed yet. We&apos;ve just sent a 4-digit code by
          SMS — enter it below to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <OtpInput value={otp} onChange={handleOtpChange} error={Boolean(error)} disabled={verifying} />

          {error ? <p className="text-coral mt-4 text-center text-sm">{error}</p> : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand text-sm font-medium hover:underline disabled:opacity-60"
            >
              {resent ? "Code resent" : resending ? "Sending…" : "Resend code"}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={verifying}
                className="border-line text-ink hover:bg-cream rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifying || otp.length < 4}
                className="bg-brand text-surface rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {verifying ? "Verifying…" : "Verify"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
