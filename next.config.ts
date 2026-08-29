import type { NextConfig } from "next";

// Validate env at build/boot time — fail fast if anything required is missing.
import "./config/env";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `mongoose` and `bcryptjs` are server-only; keep them out of any client bundle
  // and let Next trace their native/dynamic requires correctly.
  serverExternalPackages: ["mongoose", "bcryptjs"],
  // Statically-typed <Link href> / router pushes (stable in Next 15.5).
  typedRoutes: true,
};

export default nextConfig;
