"use client";

import { useEffect, useState } from "react";

import { Buildings, Check, Close } from "@/app/_components/Icons";
import { CompanyLogo } from "@/app/_components/jobs/CompanyLogo";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { JobDTO } from "@/types/job";
import type { JobApplicationDTO } from "@/types/job-application";

type Props = {
  job: JobDTO;
  open: boolean;
  onClose: () => void;
};

// A confirmation popup: shows a basic overview of the job, then submits the
// application (as the signed-in user) only once the visitor confirms.
export function ApplyModal({ job, open, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  // Reset transient state each time the modal transitions to open, so a
  // previous submission's result doesn't linger into the next open. Adjusted
  // during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSubmitting(false);
      setError(null);
      setApplied(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<JobApplicationDTO>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      setApplied(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const tags = [
    ...job.jobTypes.map((t) => ({ id: t.id, label: t.name, kind: "type" as const })),
    ...job.categories.map((c) => ({ id: c.id, label: c.name, kind: "category" as const })),
  ].slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={() => !submitting && onClose()}
        className="bg-ink/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
        className="bg-surface shadow-lift relative w-full max-w-md rounded-3xl p-6 sm:p-7"
      >
        <button
          type="button"
          onClick={() => !submitting && onClose()}
          aria-label="Close"
          className="text-muted hover:text-ink absolute top-5 right-5"
        >
          <Close className="h-5 w-5" />
        </button>

        {applied ? (
          <div className="py-4 text-center">
            <span className="bg-brand-soft text-brand mx-auto grid h-14 w-14 place-items-center rounded-full">
              <Check className="h-6 w-6" />
            </span>
            <h2 className="font-display text-ink mt-5 text-xl font-semibold">
              Application sent
            </h2>
            <p className="text-muted mt-2 text-sm leading-relaxed">
              You&apos;ve applied for {job.title}
              {job.company ? ` at ${job.company.name}` : ""}. The hiring team will reach out if
              you&apos;re a match.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="bg-brand text-surface shadow-soft mt-6 rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2
              id="apply-modal-title"
              className="font-display text-ink pr-8 text-xl font-semibold"
            >
              Confirm your application
            </h2>
            <p className="text-muted mt-1.5 text-sm">
              You&apos;re about to apply with your CareerQueue profile.
            </p>

            <div className="border-line bg-cream mt-5 flex items-start gap-3 rounded-2xl border p-4">
              <CompanyLogo
                photoUrl={job.thumbnail?.url}
                logoUrl={job.company?.logo?.url}
                name={job.company?.name ?? job.title}
                size={48}
              />
              <div className="min-w-0">
                <p className="text-ink font-semibold">{job.title}</p>
                {job.company ? (
                  <p className="text-muted mt-0.5 inline-flex items-center gap-1.5 text-sm">
                    <Buildings className="h-3.5 w-3.5 shrink-0" />
                    {job.company.name}
                  </p>
                ) : null}
                {tags.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <li
                        key={`${tag.kind}-${tag.id}`}
                        className="bg-surface border-line text-muted rounded-full border px-2 py-0.5 text-xs font-medium"
                      >
                        {tag.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            {error ? (
              <p className="border-coral/30 bg-coral/10 text-coral mt-4 rounded-2xl border px-4 py-3 text-sm">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="border-line text-ink hover:bg-cream flex-1 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="bg-brand text-surface shadow-soft flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Confirm application"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
