import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { env } from "@/config/env";
import type { AccessClaims, Principal, RefreshClaims, TokenPair } from "@/types/auth";

// Single JWT implementation, shared by the token endpoints and NextAuth.
// `jose` works in both the node and edge runtimes.

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
const opts = { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE } as const;

export async function signAccessToken(sub: string, kind: Principal): Promise<string> {
  return new SignJWT({ kind, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setIssuer(opts.issuer)
    .setAudience(opts.audience)
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(accessSecret);
}

export async function signRefreshToken(sub: string, kind: Principal): Promise<string> {
  return new SignJWT({ kind, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setIssuer(opts.issuer)
    .setAudience(opts.audience)
    .setExpirationTime(env.JWT_REFRESH_TTL)
    .sign(refreshSecret);
}

// Access + refresh pair for one identity. Shared by the user and admin flows.
export async function issueTokenPair(sub: string, kind: Principal): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(sub, kind),
    signRefreshToken(sub, kind),
  ]);
  return { accessToken, refreshToken, expiresIn: accessTokenTtlSeconds() };
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret, opts);
  if (payload.typ !== "access") throw new Error("Not an access token");
  return { sub: str(payload, "sub"), kind: principal(payload), typ: "access" };
}

export async function verifyRefreshToken(token: string): Promise<RefreshClaims> {
  const { payload } = await jwtVerify(token, refreshSecret, opts);
  if (payload.typ !== "refresh") throw new Error("Not a refresh token");
  return { sub: str(payload, "sub"), kind: principal(payload), typ: "refresh" };
}

export function accessTokenTtlSeconds(): number {
  const m = /^(\d+)\s*(s|m|h|d)$/.exec(env.JWT_ACCESS_TTL.trim());
  if (!m) return 900;
  const mult: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(m[1]) * (mult[m[2] ?? "s"] ?? 1);
}

function str(p: JWTPayload, key: string): string {
  const v = p[key];
  if (typeof v !== "string" || !v) throw new Error(`Invalid token: ${key}`);
  return v;
}

function principal(p: JWTPayload): Principal {
  if (p.kind !== "user" && p.kind !== "admin") throw new Error("Invalid token: kind");
  return p.kind;
}
