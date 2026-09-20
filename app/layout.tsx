import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";

import WhatsAppButton from "./_components/WhatsAppButton";
import { env } from "@/config/env";
import { listPublicSettings } from "@/lib/services/public-settings.service";

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

const DEFAULT_TITLE = "CareerQueue — Great careers don't happen by accident";
const DEFAULT_DESCRIPTION =
  "CareerQueue matches people to jobs that actually fit — the team, the pay, the pace. Free forever for job seekers.";

export async function generateMetadata(): Promise<Metadata> {
  const { metaTitle, metaDescription, ogImageUrl } = await listPublicSettings();
  const title = metaTitle || DEFAULT_TITLE;
  const description = metaDescription || DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: env.NEXT_PUBLIC_APP_URL,
      siteName: "CareerQueue",
      type: "website",
      images: [
        {
          url: ogImageUrl || "/images/og-image.png",
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
