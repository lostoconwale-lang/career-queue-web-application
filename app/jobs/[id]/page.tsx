import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Footer from "@/app/_components/Footer";
import Nav from "@/app/_components/Nav";
import { Buildings, Clock } from "@/app/_components/Icons";
import { CompanyLogo } from "@/app/_components/jobs/CompanyLogo";
import { JOBS } from "@/app/jobs/_data";
import { BackToResults } from "@/app/jobs/[id]/BackToResults";
import { formatRelativeTime } from "@/lib/date";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = JOBS.find((j) => j.id === id);
  return { title: job ? `${job.title} — CareerQueue` : "Job not found — CareerQueue" };
}

// UI-only for now — reads from the same placeholder data as the listing page.
// A real version will fetch a single public job by id.
export default async function JobDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const job = JOBS.find((j) => j.id === id);
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
        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
          <BackToResults />

          <div className="border-line bg-surface shadow-soft mt-6 rounded-card overflow-hidden border">
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
                  photoUrl={null}
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
                  ) : (
                    <p className="text-muted text-sm font-medium">Company not listed</p>
                  )}
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

              <div
                className="job-html text-ink mt-8 text-[15px]"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />

              <div
                id="apply"
                className="border-brand/20 bg-brand-soft mt-10 scroll-mt-24 rounded-2xl border p-6 text-center sm:p-8"
              >
                <h2 className="font-display text-ink text-xl font-semibold">
                  Apply for this role
                </h2>
                <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-relaxed">
                  The application flow is being built. In the meantime this is where you&apos;d
                  submit your details for {job.title}
                  {job.company ? ` at ${job.company.name}` : ""}.
                </p>
                <button
                  type="button"
                  disabled
                  className="bg-brand text-surface shadow-soft mt-5 rounded-full px-7 py-3 text-sm font-semibold opacity-60"
                >
                  Apply now
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
