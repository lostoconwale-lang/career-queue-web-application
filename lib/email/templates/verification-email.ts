import "server-only";

import { renderEmailHtml, type EmailBrand } from "@/lib/email/templates/layout";

// The only piece specific to this email — the rest of the look comes from
// the shared layout in ./layout.ts.
export function renderVerificationEmail(
  brand: EmailBrand,
  { name, verifyUrl }: { name: string; verifyUrl: string },
): { subject: string; html: string } {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Verify your email for ${brand.siteName}`,
    html: renderEmailHtml(brand, {
      preheader: "Confirm your email address to finish setting up your account.",
      heading: `Hi ${firstName}, one more step`,
      paragraphs: [
        `Thanks for signing up for ${brand.siteName}. Confirm this is your email address by clicking the button below.`,
        "This link is valid for 24 hours and can only be used once.",
      ],
      cta: { label: "Verify email address", url: verifyUrl },
      footnote: "If you didn't create this account, you can safely ignore this email.",
    }),
  };
}
