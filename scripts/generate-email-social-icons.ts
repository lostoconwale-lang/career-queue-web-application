// One-off generator: emails can't rely on inline <svg> (Gmail and Outlook
// don't render it), so the social row in lib/email/templates/layout.ts uses
// plain <img> tags instead. This rasterizes the same paths as
// app/_components/Icons.tsx into small PNGs and writes them to
// public/email/social/. Re-run only if those icon paths change:
//   pnpm tsx scripts/generate-email-social-icons.ts
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// 80x80 (2x) so the icon stays crisp at the 40x40 display size in the footer.
const SIZE = 80;
const ICON_COLOR = "#6b6470"; // --color-muted
const RING_COLOR = "#6c4dff"; // --color-brand, drawn at low opacity like border-brand/15

// Same `d` data as the matching component in app/_components/Icons.tsx,
// centered in a 24x24 box (translate(28,28) puts that box mid-canvas).
const ICON_INNER: Record<string, string> = {
  youtube: `<path fill="${ICON_COLOR}" d="M23 12s0-3.6-.46-5.32a2.78 2.78 0 0 0-1.96-1.96C18.86 4.26 12 4.26 12 4.26s-6.86 0-8.58.46A2.78 2.78 0 0 0 1.46 6.7 29.5 29.5 0 0 0 1 12a29.5 29.5 0 0 0 .46 5.32 2.78 2.78 0 0 0 1.96 1.96c1.72.46 8.58.46 8.58.46s6.86 0 8.58-.46a2.78 2.78 0 0 0 1.96-1.96C23 15.6 23 12 23 12ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z"/>`,
  linkedin: `<path fill="${ICON_COLOR}" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.7 8.65 22 10.9 22 14.1V21h-4v-6.1c0-1.5-.03-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21H9V9Z"/>`,
  x: `<path fill="${ICON_COLOR}" d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1-5.8 6.1H1.5l7.5-8.6L1.2 3h6.6l4.5 5.6L17.5 3Zm-1.1 16.1h1.8L7.7 4.8H5.8l10.6 14.3Z"/>`,
  instagram: `<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="${ICON_COLOR}" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="${ICON_COLOR}" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="${ICON_COLOR}" stroke="none"/>`,
  facebook: `<path fill="${ICON_COLOR}" d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/>`,
};

function buildSvg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - 1}" fill="#ffffff" stroke="${RING_COLOR}" stroke-opacity="0.15" stroke-width="1.5"/>
  <g transform="translate(28,28)">${inner}</g>
</svg>`;
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "email", "social");
  await mkdir(outDir, { recursive: true });

  for (const [platform, inner] of Object.entries(ICON_INNER)) {
    const svg = buildSvg(inner);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(path.join(outDir, `${platform}.png`), png);
    console.warn(`wrote public/email/social/${platform}.png`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
