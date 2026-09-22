import "server-only";
import { createHash, randomBytes } from "node:crypto";

// Shared by every emailed-link flow (email verification, password reset):
// the link carries the raw token, only its hash is ever stored, so a leaked
// database dump doesn't hand out working links.
export function createToken(ttlMs: number): { raw: string; hash: string; expires: Date } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw), expires: new Date(Date.now() + ttlMs) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
