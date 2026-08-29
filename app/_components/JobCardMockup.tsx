import Image from "next/image";

import type { JobCard } from "../_data";

export default function JobCardMockup({ job }: { job: JobCard }) {
  return (
    <article className="rounded-card border-line bg-surface shadow-lift w-full max-w-64 border p-5">
      <div className="flex items-center gap-3">
        <Image
          src={job.logo}
          alt=""
          width={44}
          height={44}
          className="bg-brand-soft h-11 w-11 rounded-2xl object-contain p-1"
        />
        <div className="min-w-0">
          <p className="text-ink truncate text-sm font-semibold">{job.company}</p>
          <p className="text-muted text-xs">Hiring now</p>
        </div>
      </div>

      <h3 className="text-ink mt-4 text-base leading-snug font-semibold">{job.title}</h3>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {job.tags.map((tag) => (
          <li
            key={tag}
            className="bg-brand-soft text-brand rounded-full px-2.5 py-1 text-xs font-medium"
          >
            {tag}
          </li>
        ))}
      </ul>

      <p className="text-ink mt-4 text-sm font-semibold">{job.salary}</p>
    </article>
  );
}
