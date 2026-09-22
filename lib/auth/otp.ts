import "server-only";
import { createHash } from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Stubbed at a fixed code until a real SMS gateway is wired up (see
// lib/sms/send-sms.ts). Swap this for a random 4-digit code — e.g.
// `crypto.randomInt(1000, 10000).toString()` — once sendSms actually sends.
export function generateOtp(): string {
  return "1234";
}

export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}
