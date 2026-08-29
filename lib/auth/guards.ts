import "server-only";

import { ForbiddenError } from "@/lib/api/errors";
import type { AuthContext } from "@/types/auth";

export function requireAdmin(ctx: AuthContext): void {
  if (ctx.kind !== "admin") throw new ForbiddenError("Admin access required");
}

// Allow if the caller is that user, or an admin.
export function requireSelfOrAdmin(ctx: AuthContext, userId: string): void {
  if (ctx.kind === "admin") return;
  if (ctx.kind === "user" && ctx.id === userId) return;
  throw new ForbiddenError("You can only access your own record");
}
