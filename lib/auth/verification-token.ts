import "server-only";
import { createHash, randomBytes } from "node:crypto";

// Emailed links carry the raw token; only its hash is ever stored, so a leaked
// database dump doesn't hand out working verification links.
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export function createVerificationToken(): {
  raw: string;
  hash: string;
  expires: Date;
} {
  const raw = randomBytes(32).toString("hex");
  return {
    raw,
    hash: hashVerificationToken(raw),
    expires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

export function hashVerificationToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
