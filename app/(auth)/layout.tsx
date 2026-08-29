import type { ReactNode } from "react";
import Link from "next/link";

import Logo from "@/app/_components/Logo";
import AuthArt from "@/app/_components/AuthArt";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface min-h-screen lg:grid lg:grid-cols-[1fr_1.05fr]">
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="w-fit">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      <AuthArt />
    </div>
  );
}
