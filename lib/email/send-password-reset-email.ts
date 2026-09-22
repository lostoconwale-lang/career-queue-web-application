import "server-only";

import { env } from "@/config/env";
import { resend } from "@/lib/email/resend";
import {
  renderPasswordResetEmail,
  renderPasswordResetUnavailableEmail,
} from "@/lib/email/templates/password-reset-email";
import { listPublicSettings } from "@/lib/services/public-settings.service";

async function loadBrand() {
  const { siteName, iconDarkUrl, socialLinks } = await listPublicSettings();
  return { siteName, logoUrl: iconDarkUrl, appUrl: env.NEXT_PUBLIC_APP_URL, socialLinks };
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const { subject, html } = renderPasswordResetEmail(await loadBrand(), { name, resetUrl });

  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (error) throw new Error(`Resend failed to send password-reset email: ${error.message}`);
}

export async function sendPasswordResetUnavailableEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<void> {
  const { subject, html } = renderPasswordResetUnavailableEmail(await loadBrand(), { name });

  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (error) {
    throw new Error(`Resend failed to send password-reset-unavailable email: ${error.message}`);
  }
}
