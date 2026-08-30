import type { JobApplicationStatus } from "@/types/job-application";

export const STATUS_LABEL: Record<JobApplicationStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};

// A distinct color per status (beyond the shared Badge component's 3 generic
// tones) so admins can tell every stage apart at a glance.
export const STATUS_BADGE_CLASS: Record<JobApplicationStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  reviewed: "bg-sky-50 text-sky-700",
  shortlisted: "bg-brand-soft text-brand",
  hired: "bg-emerald-50 text-emerald-700",
  rejected: "bg-coral/10 text-coral",
};
