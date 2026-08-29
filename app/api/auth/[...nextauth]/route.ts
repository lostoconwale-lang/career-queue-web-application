import { handlers } from "@/lib/auth/nextauth";

// NextAuth (web session). The token flow for other clients is /api/v1/auth/*.
export const { GET, POST } = handlers;
export const runtime = "nodejs";
