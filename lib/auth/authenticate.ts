import "server-only";
import { type NextRequest } from "next/server";

import { UnauthorizedError } from "@/lib/api/errors";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { auth } from "@/lib/auth/nextauth";
import { adminSessionValid } from "@/lib/services/admin.service";
import type { AuthContext } from "@/types/auth";

// The one auth resolver: Bearer access token OR NextAuth session cookie.
export async function authenticate(req: NextRequest): Promise<AuthContext | null> {
  const header = req.headers.get("authorization");
  const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;

  if (bearer) {
    try {
      const claims = await verifyAccessToken(bearer);
      // A revoked admin (deactivated / un-approved) loses access mid-token.
      if (claims.kind === "admin" && !(await adminSessionValid(claims.sub))) return null;
      return { id: claims.sub, kind: claims.kind, via: "bearer" };
    } catch {
      return null;
    }
  }

  // The NextAuth jwt callback already revokes deactivated admins here.
  const session = await auth();
  if (session?.user?.id) {
    return { id: session.user.id, kind: session.user.kind, via: "session" };
  }
  return null;
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const ctx = await authenticate(req);
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}
