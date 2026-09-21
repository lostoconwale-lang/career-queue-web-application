import "server-only";
import sharp, { type Sharp } from "sharp";

// Mirrors what admins were doing by hand on tools like jpeg-optimizer.com:
// downscale oversized images, then step quality down until the file fits
// under the target size (or we hit the quality floor).
const MAX_DIMENSION = 2000;
const TARGET_BYTES = 300 * 1024;
const MIN_QUALITY = 40;
const QUALITY_STEP = 10;

const RECOMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isRecompressible(mimeType: string): boolean {
  return RECOMPRESSIBLE.has(mimeType);
}

export async function compressImage(input: Buffer, mimeType: string): Promise<Buffer> {
  const metadata = await sharp(input).metadata();
  const oversized = (metadata.width ?? 0) > MAX_DIMENSION || (metadata.height ?? 0) > MAX_DIMENSION;

  if (!oversized && input.length <= TARGET_BYTES) return input;

  // rotate() bakes in EXIF orientation before sharp strips metadata on encode.
  let pipeline = sharp(input, { failOn: "none" }).rotate();
  if (oversized) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let output = input;
  for (let quality = 85; quality >= MIN_QUALITY; quality -= QUALITY_STEP) {
    output = await encode(pipeline.clone(), mimeType, quality);
    if (output.length <= TARGET_BYTES) break;
  }

  return output.length < input.length ? output : input;
}

function encode(pipeline: Sharp, mimeType: string, quality: number): Promise<Buffer> {
  switch (mimeType) {
    case "image/png":
      return pipeline.png({ quality, palette: true, compressionLevel: 9 }).toBuffer();
    case "image/webp":
      return pipeline.webp({ quality }).toBuffer();
    default:
      return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
  }
}
