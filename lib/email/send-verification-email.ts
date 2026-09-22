import "server-only";

import { env } from "@/config/env";
import { resend } from "@/lib/email/resend";
import { renderVerificationEmail } from "@/lib/email/templates/verification-email";
import { listPublicSettings } from "@/lib/services/public-settings.service";

// The "function call to verify the email": generate the token beforehand
// (see lib/auth/verification-token.ts), build the link, then call this.
// Brand bits (logo, name, social links) come from the same settings the
// public site reads, so the email updates itself if those change.
export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<void> {
  const { siteName, iconDarkUrl, socialLinks } = await listPublicSettings();

  const { subject, html } = renderVerificationEmail(
    { siteName, logoUrl: iconDarkUrl, appUrl: env.NEXT_PUBLIC_APP_URL, socialLinks },
    { name, verifyUrl },
  );

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) throw new Error(`Resend failed to send verification email: ${error.message}`);
}
