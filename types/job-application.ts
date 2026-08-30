import type { Phone } from "@/types/auth";

export const JOB_APPLICATION_STATUSES = [
  "pending",
  "reviewed",
  "shortlisted",
  "rejected",
  "hired",
] as const;
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

// The job as it appears on an application — a snapshot, not a live lookup.
export interface JobApplicationJobRef {
  id: string;
  title: string;
  company: { id: string; name: string } | null;
  categories: { id: string; name: string }[];
  jobTypes: { id: string; name: string }[];
}

// The applicant as it appears on an application — a snapshot of the user who
// applied, so the admin list never needs to join against Users.
export interface JobApplicationApplicantRef {
  id: string;
  name: string;
  email: string;
  phone: Phone | null;
}

export interface JobApplicationDTO {
  id: string;
  job: JobApplicationJobRef;
  applicant: JobApplicationApplicantRef;
  status: JobApplicationStatus;
  createdAt: string;
  updatedAt: string;
}
