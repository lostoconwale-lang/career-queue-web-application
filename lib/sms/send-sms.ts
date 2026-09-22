import "server-only";

// Stub — swap the body for a real gateway call (Twilio, MSG91, etc.) once
// one is wired up. Logs instead of sending so OTPs are visible in the server
// console during development (the OTP itself is currently hardcoded, see
// lib/auth/otp.ts).
export async function sendSms(to: string, message: string): Promise<void> {
  console.warn(`[sms] to ${to}: ${message}`);
}
