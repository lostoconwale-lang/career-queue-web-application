import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import Footer from "@/app/_components/Footer";
import Nav from "@/app/_components/Nav";
import { Buildings, Clock } from "@/app/_components/Icons";
import { CompanyLogo } from "@/app/_components/jobs/CompanyLogo";
import { ApplyButton } from "@/app/jobs/[id]/ApplyButton";
import { BackToResults } from "@/app/jobs/[id]/BackToResults";
import { auth } from "@/lib/auth/nextauth";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getPublicJobById } from "@/lib/services/public-job.service";
import { formatRelativeTime } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

// generateMetadata and the page body both need the job — cache() dedupes the
// two calls into a single DB query per request.
const loadJob = cache(async (id: string) => {
  await connectToDatabase();
  return getPublicJobById(id);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await loadJob(id);
  return { title: job ? `${job.title} — CareerQueue` : "Job not found — CareerQueue" };
}

// Server-rendered: fetches directly through the service layer (no HTTP round
// trip to our own API, since this already runs on the server).
export default async function JobDetailPage({ params }: { params: Promise<Params> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const job = await loadJob(id);
  if (!job) notFound();

  const posted = formatRelativeTime(job.createdAt);
  const tags = [
    ...job.jobTypes.map((t) => ({ id: t.id, label: t.name, kind: "type" as const })),
    ...job.categories.map((c) => ({ id: c.id, label: c.name, kind: "category" as const })),
  ];

  return (
    <>
      <Nav />
      <main>
        <div className="mx-auto  px-5 py-10 sm:px-8 sm:py-14">
          {/* <BackToResults /> */}

          <div className="mt-6 overflow-hidden rounded-card">
            {job.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.coverImage.url}
                alt=""
                className="h-48 w-full object-cover sm:h-64"
              />
            ) : null}

            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-start gap-5">
                <CompanyLogo
                  photoUrl={job.thumbnail?.url}
                  logoUrl={job.company?.logo?.url}
                  name={job.company?.name ?? job.title}
                  size={64}
                />
                <div className="min-w-0 flex-1">
                  {job.company ? (
                    <p className="text-muted inline-flex items-center gap-1.5 text-sm font-medium">
                      <Buildings className="h-3.5 w-3.5 shrink-0" />
                      {job.company.name}
                    </p>
                  ) : null}
                  <h1 className="font-display text-ink mt-1 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
                    {job.title}
                  </h1>
                  <p className="text-muted mt-2 inline-flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    Posted {posted}
                  </p>
                </div>
              </div>

              {tags.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <li
                      key={`${tag.kind}-${tag.id}`}
                      className={
                        tag.kind === "category"
                          ? "bg-brand-soft text-brand rounded-full px-2.5 py-1 text-xs font-medium"
                          : "border-line text-muted rounded-full border px-2.5 py-1 text-xs font-medium"
                      }
                    >
                      {tag.label}
                    </li>
                  ))}
                </ul>
              ) : null}

              {job.description ? (
                <div
                  className="job-html text-ink mt-8 text-[15px]"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : null}

              <div
                id="apply"
                className="border-brand/20 bg-brand-soft mt-10 scroll-mt-24 rounded-2xl border p-6 text-center sm:p-8"
              >
                <h2 className="font-display text-ink text-xl font-semibold">
                  Apply for this role
                </h2>
                <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-relaxed">
                  Ready to apply for {job.title}
                  {job.company ? ` at ${job.company.name}` : ""}? You&apos;ll confirm before
                  anything is sent.
                </p>
                <ApplyButton job={job} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
