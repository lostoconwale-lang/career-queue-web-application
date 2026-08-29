import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

import { env } from "@/config/env";

// Cloudflare R2 speaks the S3 API. Needs a fixed endpoint, region "auto", and
// checksums only "when required" (R2 rejects the SDK's default crc32 header).
export const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
});
