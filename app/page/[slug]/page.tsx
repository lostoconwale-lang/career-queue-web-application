import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Footer from "@/app/_components/Footer";
import Nav from "@/app/_components/Nav";
import { env } from "@/config/env";
import { getPublicPageBySlug } from "@/lib/services/public-page.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { slug: string };

// generateMetadata and the page body both need the page — cache() dedupes the
// two calls into a single DB query per request.
const loadPage = cache(async (slug: string) => getPublicPageBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "Page not found — CareerQueue" };

  const title = page.seo.metaTitle || page.title;
  const description = page.seo.metaDescription || undefined;

  return {
    title: `${title} — CareerQueue`,
    description,
    keywords: page.seo.metaKeywords.length ? page.seo.metaKeywords : undefined,
    openGraph: {
      title,
      description,
      images: page.seo.ogImage ? [page.seo.ogImage] : undefined,
      type: "website",
    },
    alternates: { canonical: `${env.NEXT_PUBLIC_APP_URL}/page/${slug}` },
  };
}

// Public route. Server-rendered: fetches directly through the service layer
// (no HTTP round trip to our own API, since this already runs on the server).
export default async function StaticPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <>
      <Nav />
      <main>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
          <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            {page.title}
          </h1>
          <div
            className="job-html text-ink mt-8 text-[15px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
