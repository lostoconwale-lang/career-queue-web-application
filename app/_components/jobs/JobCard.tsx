"use client";

import { useState } from "react";
import Link from "next/link";

import { ApplyModal } from "@/app/_components/jobs/ApplyModal";
import { CompanyLogo } from "@/app/_components/jobs/CompanyLogo";
import { Buildings, Clock } from "@/app/_components/Icons";
import { formatRelativeTime } from "@/lib/date";
import { htmlToText } from "@/lib/sanitize-html";
import type { JobDTO } from "@/types/job";

type Props = {
  job: JobDTO;
  view: "list" | "grid";
};

export function JobCard({ job, view }: Props) {
  const [applying, setApplying] = useState(false);
  const isGrid = view === "grid";
  const description = htmlToText(job.description);
  const posted = formatRelativeTime(job.createdAt);

  const maxTags = isGrid ? 3 : 4;
  const tags = [
    ...job.jobTypes.map((t) => ({ id: t.id, label: t.name, kind: "type" as const })),
    ...job.categories.map((c) => ({ id: c.id, label: c.name, kind: "category" as const })),
  ];
  const visibleTags = tags.slice(0, maxTags);
  const overflow = tags.length - visibleTags.length;

  return (
    <article
      className={`group rounded-card border-line bg-surface shadow-soft hover:border-brand/30 hover:shadow-lift flex border p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${
        isGrid ? "h-full flex-col" : "flex-col gap-5 sm:flex-row sm:items-start"
      }`}
    >
      <CompanyLogo
        photoUrl={job.thumbnail?.url}
        logoUrl={job.company?.logo?.url}
        name={job.company?.name ?? job.title}
        size={isGrid ? 52 : 60}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {job.company ? (
            <span className="text-muted inline-flex min-w-0 items-center gap-1.5 text-sm font-medium">
              <Buildings className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{job.company.name}</span>
            </span>
          ) : (
            <span className="text-muted text-sm font-medium">Company not listed</span>
          )}
          <span className="text-muted/40">·</span>
          <span className="text-muted inline-flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {posted}
          </span>
        </div>

        <h3 className="font-display text-ink group-hover:text-brand mt-1.5 line-clamp-2 text-lg font-semibold transition-colors sm:text-xl">
          <Link href={`/jobs/${job.id}`}>{job.title}</Link>
        </h3>

        {visibleTags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
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
            {overflow > 0 ? (
              <li className="text-muted bg-cream rounded-full px-2.5 py-1 text-xs font-medium">
                +{overflow} more
              </li>
            ) : null}
          </ul>
        ) : null}

        <p className={`text-muted mt-3 text-sm leading-relaxed ${isGrid ? "line-clamp-3" : "line-clamp-2"}`}>
          {description}
        </p>

        <div className={`mt-5 flex gap-2.5 ${isGrid ? "" : "sm:mt-4"}`}>
          <button
            type="button"
            onClick={() => setApplying(true)}
            className="bg-brand text-surface shadow-soft rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Apply
          </button>
          <Link
            href={`/jobs/${job.id}`}
            className="border-line text-ink hover:bg-cream rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            View more
          </Link>
        </div>
      </div>

      <ApplyModal job={job} open={applying} onClose={() => setApplying(false)} />
    </article>
  );
}
