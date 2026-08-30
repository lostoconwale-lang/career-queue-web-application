"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { Buildings, Mail } from "@/app/_components/Icons";
import { Select } from "@/app/_components/Select";
import { Badge } from "@/app/admin/_components/table-ui";
import { redirectOnDenied } from "@/lib/auth-redirect";
import { formatDateTime } from "@/lib/date";
import { JOB_APPLICATION_STATUSES, type JobApplicationStatus } from "@/types/job-application";
import type { ApiResponse } from "@/types/api";
import type { JobApplicationDTO } from "@/types/job-application";

const STATUS_OPTIONS = JOB_APPLICATION_STATUSES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const STATUS_BADGE_TONE: Record<JobApplicationStatus, "neutral" | "brand" | "danger"> = {
  pending: "neutral",
  reviewed: "neutral",
  shortlisted: "brand",
  hired: "brand",
  rejected: "danger",
};

export function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [application, setApplication] = useState<JobApplicationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/v1/applications/${applicationId}`, { cache: "no-store" })
      .then((res) => {
        if (redirectOnDenied(res)) return null;
        return res.json() as Promise<ApiResponse<JobApplicationDTO>>;
      })
      .then((json) => {
        if (!alive || !json) return;
        if (json.success) setApplication(json.data);
        else setLoadError(json.error.message);
      })
      .catch(() => {
        if (alive) setLoadError("Could not load this application.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [applicationId]);

  async function changeStatus(status: string) {
    if (!application) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<JobApplicationDTO>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      setApplication(json.data);
    } catch {
      setError("Could not update the status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}`, { method: "DELETE" });
      if (redirectOnDenied(res)) return;
      if (!res.ok) {
        const json = (await res.json()) as ApiResponse<unknown>;
        setError(json.success ? "Could not delete this application." : json.error.message);
        return;
      }
      router.push("/admin/applications");
      router.refresh();
    } catch {
      setError("Could not delete this application. Please try again.");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    );
  }

  if (loadError || !application) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <p className="border-coral/30 bg-coral/10 text-coral rounded-2xl border px-4 py-3 text-sm">
          {loadError ?? "Application not found."}
        </p>
        <Link
          href="/admin/applications"
          className="text-brand mt-4 inline-block text-sm font-semibold hover:underline"
        >
          ← Back to applications
        </Link>
      </div>
    );
  }

  const tags = [
    ...application.job.jobTypes.map((t) => ({ id: t.id, label: t.name, kind: "type" as const })),
    ...application.job.categories.map((c) => ({
      id: c.id,
      label: c.name,
      kind: "category" as const,
    })),
  ];

  return (
    <div className="px-5 py-10 sm:px-8">
      <Link href="/admin/applications" className="text-muted hover:text-ink text-sm font-medium">
        ← Applications
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            {application.applicant.name}
          </h1>
          <p className="text-muted mt-2 text-sm">
            Applied for <span className="text-ink font-medium">{application.job.title}</span> ·{" "}
            {formatDateTime(application.createdAt)}
          </p>
        </div>
        <Badge tone={STATUS_BADGE_TONE[application.status]}>
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </Badge>
      </div>

      {error ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
          <h2 className="font-display text-ink text-lg font-semibold">Applicant</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="text-ink mt-0.5 font-medium">{application.applicant.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="text-ink mt-0.5 inline-flex items-center gap-1.5 font-medium">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a href={`mailto:${application.applicant.email}`} className="hover:underline">
                  {application.applicant.email}
                </a>
              </dd>
            </div>
            {application.applicant.phone ? (
              <div>
                <dt className="text-muted">Phone</dt>
                <dd className="text-ink mt-0.5 font-medium">
                  {application.applicant.phone.countryCode} {application.applicant.phone.number}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
          <h2 className="font-display text-ink text-lg font-semibold">Job</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-muted">Title</dt>
              <dd className="text-ink mt-0.5 font-medium">
                <Link href={`/admin/jobs/${application.job.id}/edit`} className="hover:underline">
                  {application.job.title}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Company</dt>
              <dd className="text-ink mt-0.5 inline-flex items-center gap-1.5 font-medium">
                <Buildings className="h-3.5 w-3.5 shrink-0" />
                {application.job.company?.name ?? "Not listed"}
              </dd>
            </div>
            {tags.length > 0 ? (
              <div>
                <dt className="text-muted">Category / Type</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={`${tag.kind}-${tag.id}`}
                      className={
                        tag.kind === "category"
                          ? "bg-brand-soft text-brand rounded-full px-2.5 py-1 text-xs font-medium"
                          : "border-line text-muted rounded-full border px-2.5 py-1 text-xs font-medium"
                      }
                    >
                      {tag.label}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      </div>

      <section className="bg-surface border-line shadow-soft mt-6 rounded-2xl border p-6 sm:p-7">
        <h2 className="font-display text-ink text-lg font-semibold">Status</h2>
        <p className="text-muted mt-0.5 text-sm">Move this application through your review pipeline.</p>
        <div className="mt-4 max-w-56">
          <Select
            value={application.status}
            onChange={changeStatus}
            options={STATUS_OPTIONS}
            ariaLabel="Application status"
          />
        </div>
        {updatingStatus ? <p className="text-muted mt-2 text-xs">Saving…</p> : null}
      </section>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="border-coral/40 text-coral hover:bg-coral/10 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Delete application
        </button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        busy={deleting}
        tone="danger"
        title="Delete this application?"
        description={`${application.applicant.name}'s application for "${application.job.title}" will be removed.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
