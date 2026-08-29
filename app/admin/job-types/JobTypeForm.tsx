"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { JobTypeDTO } from "@/types/job-type";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function JobTypeForm({ jobTypeId }: { jobTypeId?: string }) {
  const router = useRouter();
  const editing = Boolean(jobTypeId);

  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!jobTypeId) return;
    let alive = true;
    fetch(`/api/v1/job-types/${jobTypeId}`, { cache: "no-store" })
      .then((res) =>
        redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<JobTypeDTO>>),
      )
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        setName(json.data.name);
        setDescription(json.data.description);
      })
      .catch(() => {
        if (alive) setLoadError("Could not load this job type.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [jobTypeId]);

  function validate(): boolean {
    const message = name.trim().length >= 2 ? undefined : "Enter the job type name";
    setNameError(message);
    return !message;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const body = { name: name.trim(), description: description.trim() };

    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/v1/job-types/${jobTypeId}` : "/api/v1/job-types", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<JobTypeDTO>;
      if (!json.success) {
        const details = json.error.details ?? {};
        if (details.name?.length) setNameError(details.name[0]);
        else setFormError(json.error.message);
        return;
      }
      router.push("/admin/job-types");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <p className="border-coral/30 bg-coral/10 text-coral rounded-2xl border px-4 py-3 text-sm">
          {loadError}
        </p>
        <Link
          href="/admin/job-types"
          className="text-brand mt-4 inline-block text-sm font-semibold hover:underline"
        >
          ← Back to job types
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <Link href="/admin/job-types" className="text-muted hover:text-ink text-sm font-medium">
        ← Job types
      </Link>
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {editing ? "Edit job type" : "New job type"}
      </h1>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl" noValidate>
        <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
          <h2 className="font-display text-ink text-lg font-semibold">Details</h2>
          <p className="text-muted mt-0.5 text-sm">
            e.g. Full time, Part time, Contract, Remote, Hybrid.
          </p>

          <div className="mt-6 space-y-5">
            <AuthField
              label="Name *"
              name="name"
              placeholder="e.g. Full time"
              value={name}
              error={nameError}
              onChange={(e) => setName(e.target.value)}
              onBlur={validate}
            />

            <label className="block">
              <span className="text-ink flex items-center justify-between text-sm font-medium">
                Description
                <span className="text-muted text-xs font-normal tabular-nums">
                  {description.length}/200
                </span>
              </span>
              <textarea
                name="description"
                rows={2}
                maxLength={200}
                placeholder="A short note shown to admins (optional)."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`mt-2 resize-none ${inputClass}`}
              />
            </label>
          </div>
        </section>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/admin/job-types"
            className="border-line text-ink hover:bg-cream rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-surface shadow-soft rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : editing ? "Save changes" : "Create job type"}
          </button>
        </div>
      </form>
    </div>
  );
}
