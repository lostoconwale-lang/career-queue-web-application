import "server-only";

import { SOCIAL_PLATFORM_LABELS, type SocialLink } from "@/types/settings";

// Shared shell for every transactional email — brand header, a white content
// card, and a footer with the same social row as the site's <Footer>. Each
// email type (verification, password reset, ...) only supplies `content`;
// everything else here stays identical so all outgoing mail looks like one
// product. Table-based + inline styles throughout: Outlook (Word engine) and
// Gmail both ignore <style> blocks and most CSS, so nothing here relies on
// external CSS, flexbox/grid, or inline <svg> (icons are pre-rasterized PNGs —
// see scripts/generate-email-social-icons.ts).

export interface EmailBrand {
  siteName: string;
  logoUrl: string | null;
  appUrl: string;
  socialLinks: SocialLink[];
}

export interface EmailContent {
  /** Inbox preview text (hidden in the body, shown next to the subject). */
  preheader: string;
  /** Small uppercase label above the heading, e.g. "Verify your email". */
  eyebrow?: string;
  heading: string;
  /** Paragraphs rendered as-is; keep each one short. Plain text — escaped for you. */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Small print under the button, e.g. link expiry or a security note. */
  footnote?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSocialRow(socialLinks: SocialLink[], appUrl: string): string {
  if (socialLinks.length === 0) return "";
  const cells = socialLinks
    .map(
      ({ platform, url }) => `
        <td style="padding: 0 6px;">
          <a href="${escapeHtml(url)}" style="display: inline-block; text-decoration: none;">
            <img
              src="${appUrl}/email/social/${platform}.png"
              width="40"
              height="40"
              alt="${escapeHtml(SOCIAL_PLATFORM_LABELS[platform])}"
              style="display: block; border-radius: 999px; border: 0;"
            />
          </a>
        </td>`,
    )
    .join("");

  return `
    <tr>
      <td align="center" style="padding: 24px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>${cells}</tr>
        </table>
      </td>
    </tr>`;
}

export function renderEmailHtml(brand: EmailBrand, content: EmailContent): string {
  const { siteName, logoUrl, appUrl, socialLinks } = brand;
  const { preheader, eyebrow, heading, paragraphs, cta, footnote } = content;

  const paragraphsHtml = paragraphs
    .map(
      (p) => `
        <tr>
          <td style="padding: 0 0 16px; color: #6b6470; font-size: 15px; line-height: 1.6; font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
            ${escapeHtml(p)}
          </td>
        </tr>`,
    )
    .join("");

  const ctaHtml = cta
    ? `
        <tr>
          <td style="padding: 12px 0 4px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="#6c4dff" style="border-radius: 999px;">
                  <a
                    href="${escapeHtml(cta.url)}"
                    style="display: inline-block; padding: 14px 32px; font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 999px;"
                  >
                    ${escapeHtml(cta.label)}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    : "";

  const footnoteHtml = footnote
    ? `
        <tr>
          <td style="padding: 16px 0 0; color: #6b6470; font-size: 13px; line-height: 1.6; font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
            ${escapeHtml(footnote)}
          </td>
        </tr>`
    : "";

  const eyebrowHtml = eyebrow
    ? `
        <tr>
          <td style="padding: 0 0 8px; color: #6c4dff; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
            ${escapeHtml(eyebrow)}
          </td>
        </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(siteName)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #fbf7f1;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      ${escapeHtml(preheader)}
    </div>

    <!--[if gte mso 9]>
    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
      <v:fill type="frame" src="${appUrl}/email/background.jpg" color="#fbf7f1" />
    </v:background>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fbf7f1;">
      <tr>
        <td
          align="center"
          background="${appUrl}/email/background.jpg"
          bgcolor="#fbf7f1"
          style="padding: 40px 16px; background-image: url('${appUrl}/email/background.jpg'); background-repeat: no-repeat; background-position: top center; background-size: cover;"
        >
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width: 560px; max-width: 100%;">
            <!-- header: logo + site name -->
            <tr>
              <td align="center" style="padding: 0 0 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    ${
                      logoUrl
                        ? `<td style="padding-right: 10px;"><img src="${escapeHtml(logoUrl)}" width="36" height="36" alt="" style="display: block; border: 0;" /></td>`
                        : ""
                    }
                    <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 600; color: #1a1620;">
                      ${escapeHtml(siteName)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- content card -->
            <tr>
              <td style="background-color: #ffffff; border: 1px solid #efe9df; border-radius: 24px; padding: 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${eyebrowHtml}
                  <tr>
                    <td style="padding: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.3; font-weight: 600; color: #1a1620;">
                      ${escapeHtml(heading)}
                    </td>
                  </tr>
                  ${paragraphsHtml}
                  ${ctaHtml}
                  ${footnoteHtml}
                </table>
              </td>
            </tr>

            <!-- footer: social row + copyright, mirrors app/_components/Footer.tsx -->
            <tr>
              <td style="padding: 32px 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${renderSocialRow(socialLinks, appUrl)}
                  <tr>
                    <td align="center" style="padding: 20px 0 0; color: #6b6470; font-size: 12px; font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
                      © ${new Date().getFullYear()} ${escapeHtml(siteName)}. All rights reserved.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
