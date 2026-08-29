import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { connectToDatabase } from "@/lib/db/mongoose";
import { loginBodySchema } from "@/lib/validators/auth.validator";
import { adminLoginBodySchema } from "@/lib/validators/admin.validator";
import { upsertGoogleUser, verifyCredentials } from "@/lib/services/auth.service";
import { adminSessionValid, verifyAdminLogin } from "@/lib/services/admin.service";
import { activityActor, logAdminLogout } from "@/lib/services/activity-log.service";
import type { Principal } from "@/types/auth";

interface Claims {
  id?: string;
  kind?: Principal;
  needsPhone?: boolean;
  loginAt?: number;
  sub?: string;
}

// Admin sessions expire 12h after login, regardless of activity.
const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;

const config = {
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google,
    // Website users.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginBodySchema.safeParse(raw);
        if (!parsed.success) return null;
        try {
          const identity = await verifyCredentials(parsed.data);
          return { id: identity.id, email: identity.email, name: identity.name, kind: "user" };
        } catch {
          return null;
        }
      },
    }),
    // Admins — separate provider, separate credential check.
    Credentials({
      id: "admin-login",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = adminLoginBodySchema.safeParse(raw);
        if (!parsed.success) return null;
        try {
          const identity = await verifyAdminLogin(parsed.data);
          return { id: identity.id, email: identity.email, name: identity.name, kind: "admin" };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // Google: find-or-create the account, then carry our own id/kind onto `user`
    // so the jwt callback can persist them. Credentials sign-in is untouched.
    async signIn({ account, user, profile }) {
      if (account?.provider !== "google") return true;
      const email = profile?.email;
      if (!email) return false;
      await connectToDatabase();
      const { id, needsPhone, adminVerified } = await upsertGoogleUser({
        name: profile.name ?? email,
        email,
      });
      // Every account waits for admin approval before it gets a session.
      if (!adminVerified) return "/pending";
      user.id = id;
      user.kind = "user";
      user.needsPhone = needsPhone;
      return true;
    },
    async jwt({ token, user }) {
      const c = token as Claims;
      if (user) {
        c.id = user.id ?? c.sub ?? "";
        c.kind = user.kind;
        c.needsPhone = user.needsPhone;
        if (user.kind === "admin") c.loginAt = Date.now();
      }
      // Admins: expire 12h after login, and re-check approval/active status on
      // every read so a deactivated admin is signed out immediately.
      if (c.kind === "admin") {
        if (!c.loginAt || Date.now() - c.loginAt > ADMIN_SESSION_MS) return null;
        await connectToDatabase();
        if (!(await adminSessionValid(c.id ?? c.sub ?? ""))) return null;
      }
      return token;
    },
    session({ session, token }) {
      const c = token as Claims;
      session.user.id = c.id ?? c.sub ?? "";
      session.user.kind = c.kind ?? "user";
      session.user.needsPhone = c.needsPhone;
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const c = token as Claims | null;
      if (c?.kind !== "admin") return;
      await connectToDatabase();
      await logAdminLogout(await activityActor(c.id ?? c.sub ?? ""));
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
