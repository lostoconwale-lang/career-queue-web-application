import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: "CareerQueue — Great careers don't happen by accident",
  description:
    "CareerQueue matches people to jobs that actually fit — the team, the pay, the pace. Free forever for job seekers.",
  openGraph: {
    title: "CareerQueue — Great careers don't happen by accident",
    description:
      "CareerQueue matches people to jobs that actually fit — the team, the pay, the pace.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
