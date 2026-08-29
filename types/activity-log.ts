export const ACTIVITY_LOG_TYPES = [
  "user",
  "admin",
  "auth",
  "city",
  "category",
  "job-type",
  "job",
  "testimonial",
  "faq",
  "static-page",
  "settings",
  "media",
] as const;
export type ActivityLogType = (typeof ACTIVITY_LOG_TYPES)[number];

export const ACTIVITY_LOG_CATEGORIES = ["create", "read", "update", "delete"] as const;
export type ActivityLogCategory = (typeof ACTIVITY_LOG_CATEGORIES)[number];

export interface ActivityLogDTO {
  id: string;
  type: ActivityLogType;
  category: ActivityLogCategory;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminMobile: string;
  message: string;
  createdAt: string;
}
