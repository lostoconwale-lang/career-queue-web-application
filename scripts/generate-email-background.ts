// One-off generator: derives a lightweight, portrait-shaped background from
// the Hero section's texture (public/images/hero-bg-texture.png, 1920x1080,
// ~2.3MB — the wrong shape and far too heavy for an email) so the email
// layout's outer band can use the same lavender → cream → coral wash.
// Re-run only if hero-bg-texture.png changes:
//   pnpm tsx scripts/generate-email-background.ts
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

async function main() {
  const outDir = path.join(process.cwd(), "public", "email");
  await mkdir(outDir, { recursive: true });

  await sharp(path.join(process.cwd(), "public", "images", "hero-bg-texture.png"))
    // Stretched, not cropped — the source is a smooth blurred gradient, so
    // distorting it slightly is invisible, and this keeps both corner blobs
    // (lavender top-left, coral bottom-right) in frame at a tall aspect.
    .resize(640, 960, { fit: "fill" })
    .jpeg({ quality: 78 })
    .toFile(path.join(outDir, "background.jpg"));

  console.warn("wrote public/email/background.jpg");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
