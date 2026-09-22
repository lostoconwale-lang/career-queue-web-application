import "server-only";

import { renderEmailHtml, type EmailBrand } from "@/lib/email/templates/layout";

export function renderPasswordResetEmail(
  brand: EmailBrand,
  { name, resetUrl }: { name: string; resetUrl: string },
): { subject: string; html: string } {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Reset your ${brand.siteName} password`,
    html: renderEmailHtml(brand, {
      preheader: "Use this link to choose a new password.",
      eyebrow: "Reset your password",
      heading: `Hi ${firstName}, let's reset it`,
      paragraphs: [
        `We got a request to reset the password for your ${brand.siteName} account. Click the button below to choose a new one.`,
        "This link is valid for 1 hour and can only be used once.",
      ],
      cta: { label: "Reset password", url: resetUrl },
      footnote: "If you didn't request this, you can safely ignore this email — your password won't change.",
    }),
  };
}

// Sent instead of a reset link when the account has no password at all
// (it signed up via Google) — there's nothing to reset.
export function renderPasswordResetUnavailableEmail(
  brand: EmailBrand,
  { name }: { name: string },
): { subject: string; html: string } {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `About your ${brand.siteName} password`,
    html: renderEmailHtml(brand, {
      preheader: "Your account signs in with Google — there's no password to reset.",
      eyebrow: "Password reset",
      heading: `Hi ${firstName}, one thing to know`,
      paragraphs: [
        `Someone requested a password reset for this email address, but your ${brand.siteName} account was created with Google sign-in and doesn't have a password.`,
        "Just continue signing in with Google — there's nothing else to do here.",
      ],
      footnote: "If this wasn't you, you can safely ignore this email.",
    }),
  };
}
