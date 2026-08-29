"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthField } from "@/app/_components/AuthField";
import { redirectOnDenied } from "@/lib/auth-redirect";
import type { ApiResponse } from "@/types/api";
import type { FaqDTO } from "@/types/faq";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function FaqForm({ faqId }: { faqId?: string }) {
  const router = useRouter();
  const editing = Boolean(faqId);

  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!faqId) return;
    let alive = true;
    fetch(`/api/v1/faqs/${faqId}`, { cache: "no-store" })
      .then((res) => (redirectOnDenied(res) ? null : (res.json() as Promise<ApiResponse<FaqDTO>>)))
      .then((json) => {
        if (!alive || !json) return;
        if (!json.success) {
          setLoadError(json.error.message);
          return;
        }
        const f = json.data;
        setQuestion(f.question);
        setAnswer(f.answer);
        setSortOrder(String(f.sortOrder));
      })
      .catch(() => {
        if (alive) setLoadError("Could not load this FAQ.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [faqId]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (question.trim().length < 5) e.question = "Enter the question";
    if (answer.trim().length < 5) e.answer = "Enter the answer";
    const n = Number(sortOrder);
    if (!Number.isInteger(n) || n < 0) e.sortOrder = "Enter a whole number (0 or more)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const body = {
      question: question.trim(),
      answer: answer.trim(),
      sortOrder: Number(sortOrder),
    };

    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/v1/faqs/${faqId}` : "/api/v1/faqs", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (redirectOnDenied(res)) return;
      const json = (await res.json()) as ApiResponse<FaqDTO>;
      if (!json.success) {
        setFormError(json.error.message || "Could not save this FAQ.");
        return;
      }
      router.push("/admin/faqs");
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
          href="/admin/faqs"
          className="text-brand mt-4 inline-block text-sm font-semibold hover:underline"
        >
          ← Back to FAQs
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <Link href="/admin/faqs" className="text-muted hover:text-ink text-sm font-medium">
        ← FAQs
      </Link>
      <h1 className="font-display text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {editing ? "Edit FAQ" : "New FAQ"}
      </h1>

      {formError ? (
        <p className="border-coral/30 bg-coral/10 text-coral mt-5 rounded-2xl border px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 " noValidate>
        <section className="bg-surface border-line shadow-soft rounded-2xl border p-6 sm:p-7">
          <div className="space-y-6">
            <label className="block">
              <span className="text-ink flex items-center justify-between text-sm font-medium">
                Question <span className="text-coral">*</span>
                <span className="text-muted text-xs font-normal tabular-nums">
                  {question.trim().length}/250
                </span>
              </span>
              <textarea
                name="question"
                rows={2}
                maxLength={250}
                placeholder="e.g. How do I apply for a job?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                aria-invalid={errors.question ? true : undefined}
                className={`mt-2 resize-none ${inputClass} ${
                  errors.question ? "border-coral focus:border-coral focus:ring-coral/10" : ""
                }`}
              />
              {errors.question ? (
                <span className="text-coral mt-1.5 block text-sm">{errors.question}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="text-ink flex items-center justify-between text-sm font-medium">
                Answer <span className="text-coral">*</span>
                <span className="text-muted text-xs font-normal tabular-nums">
                  {answer.trim().length}/4000
                </span>
              </span>
              <textarea
                name="answer"
                rows={6}
                maxLength={4000}
                placeholder="Write the answer shown on the FAQ page…"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                aria-invalid={errors.answer ? true : undefined}
                className={`mt-2 resize-y ${inputClass} ${
                  errors.answer ? "border-coral focus:border-coral focus:ring-coral/10" : ""
                }`}
              />
              {errors.answer ? (
                <span className="text-coral mt-1.5 block text-sm">{errors.answer}</span>
              ) : null}
            </label>

            <div className="max-w-40">
              <AuthField
                label="Display order"
                name="sortOrder"
                type="number"
                min={0}
                placeholder="0"
                value={sortOrder}
                error={errors.sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
              <p className="text-muted mt-1 text-xs">Lower numbers show first.</p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/admin/faqs"
            className="border-line text-ink hover:bg-cream rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-surface shadow-soft rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : editing ? "Save changes" : "Create FAQ"}
          </button>
        </div>
      </form>
    </div>
  );
}
