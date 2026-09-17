import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/nextauth";

export default auth((req) => {
  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/jobs", "/jobs/:path*"],
};
