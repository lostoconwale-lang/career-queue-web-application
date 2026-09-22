import "server-only";

import { ConflictError, ForbiddenError, UnauthorizedError } from "@/lib/api/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { issueTokenPair, verifyRefreshToken } from "@/lib/auth/jwt";
import { createVerificationToken, hashVerificationToken } from "@/lib/auth/verification-token";
import { env } from "@/config/env";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
import { User } from "@/lib/models/user.model";
import { adminSessionValid } from "@/lib/services/admin.service";
import { toUserDTO } from "@/lib/services/user.service";
import type { CompleteProfileBody, LoginBody, RegisterBody } from "@/lib/validators/auth.validator";
import type { TokenPair } from "@/types/auth";
import type { UserDTO } from "@/types/user";

// Builds the token, saves its hash on the user, and emails the raw one.
// Registration must not fail because the email provider hiccuped, so send
// errors are logged, not thrown — the user can request another one later via
// resendVerificationEmail.
async function issueAndSendVerificationEmail(user: {
  _id: { toString(): string };
  name: string;
  email: string;
}): Promise<void> {
  const { raw, hash, expires } = createVerificationToken();
  await User.updateOne(
    { _id: user._id },
    { emailVerificationTokenHash: hash, emailVerificationExpires: expires },
  );

  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${raw}`;
  try {
    await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
  } catch (error) {
    console.error("[auth] failed to send verification email:", error);
  }
}

// Creates a pending account. No tokens are issued — an admin must approve it
// (adminVerified) before it can sign in. A verification email goes out
// separately (emailVerified), which isn't currently a login gate.
export async function registerUser(body: RegisterBody): Promise<{ user: UserDTO }> {
  if (await User.exists({ email: body.email })) {
    throw new ConflictError("An account with this email already exists");
  }
  if (await User.exists({ "phone.number": body.phone.number })) {
    throw new ConflictError("An account with this mobile number already exists");
  }
  const doc = await User.create({
    name: body.name,
    email: body.email,
    phone: body.phone,
    passwordHash: await hashPassword(body.password),
    registrationType: "manual",
    adminVerified: false,
  });

  await issueAndSendVerificationEmail(doc);

  return { user: toUserDTO(doc) };
}

// POST /api/v1/auth/verify-email — the link from the email calls this.
export async function verifyEmailToken(rawToken: string): Promise<void> {
  const user = await User.findOne({
    emailVerificationTokenHash: hashVerificationToken(rawToken),
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!user) throw new UnauthorizedError("This verification link is invalid or has expired");

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
}

// POST /api/v1/auth/resend-verification — lets a user request a fresh link.
// Silently no-ops for unknown emails or already-verified accounts so this
// can't be used to probe which addresses have accounts.
export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user || user.emailVerified) return;
  await issueAndSendVerificationEmail(user);
}

// First Google sign-in creates the account (no phone yet); a matching email just
// signs into the existing account. Called from the NextAuth google provider.
export async function upsertGoogleUser(profile: {
  name: string;
  email: string;
}): Promise<{ id: string; needsPhone: boolean; adminVerified: boolean }> {
  const existing = await User.findOne({ email: profile.email });
  if (existing) {
    return {
      id: existing._id.toString(),
      needsPhone: !existing.phone?.number,
      adminVerified: existing.adminVerified,
    };
  }
  const doc = await User.create({
    name: profile.name,
    email: profile.email,
    registrationType: "google",
    status: "active",
    adminVerified: false,
  });
  return { id: doc._id.toString(), needsPhone: true, adminVerified: false };
}

// Step 2 of Google onboarding: attach the mobile number.
export async function completeProfile(
  userId: string,
  phone: CompleteProfileBody["phone"],
): Promise<UserDTO> {
  const doc = await User.findById(userId);
  if (!doc) throw new UnauthorizedError();
  if (await User.exists({ "phone.number": phone.number, _id: { $ne: doc._id } })) {
    throw new ConflictError("An account with this mobile number already exists");
  }
  doc.phone = phone;
  await doc.save();
  return toUserDTO(doc);
}

// User credential check — used by /api/v1/auth/login AND the NextAuth user
// provider. Admins go through admin.service.verifyAdminLogin. Sign-in with
// either identifier — the caller guarantees exactly one is present.
export async function verifyCredentials(body: LoginBody): Promise<{
  id: string;
  email: string;
  name: string;
}> {
  const user = body.email
    ? await User.findOne({ email: body.email }).select("+passwordHash")
    : await User.findOne({ "phone.number": body.phone?.number }).select("+passwordHash");
  if (!user) throw new UnauthorizedError("Invalid credentials");
  if (!user.passwordHash) throw new UnauthorizedError("This account uses Google sign-in");

  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid credentials");
  if (user.status !== "active") throw new ForbiddenError("Account is suspended");
  if (!user.adminVerified) throw new ForbiddenError("Your account is awaiting admin approval");

  return { id: user._id.toString(), email: user.email, name: user.name };
}

export async function login(body: LoginBody): Promise<{
  identity: { id: string; email: string; name: string };
  tokens: TokenPair;
}> {
  const identity = await verifyCredentials(body);
  return { identity, tokens: await issueTokenPair(identity.id, "user") };
}

// Stateless rotation: verify the refresh JWT, confirm the account is still
// active, hand back a fresh pair. (No server-side token store.)
export async function refresh(refreshToken: string): Promise<TokenPair> {
  let claims;
  try {
    claims = await verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const stillValid =
    claims.kind === "admin"
      ? await adminSessionValid(claims.sub)
      : await User.findById(claims.sub)
          .select("status adminVerified")
          .then((u) => !!u && u.status === "active" && u.adminVerified);
  if (!stillValid) throw new UnauthorizedError("Account is not active");

  return issueTokenPair(claims.sub, claims.kind);
}
