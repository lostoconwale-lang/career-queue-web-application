// Admin-facing notifications, written automatically on notable user events.
export const ALERT_TYPES = [
  "user_registered",
  "password_changed",
  "user_login",
  "job_applied",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  user_registered: "New registration",
  password_changed: "Password changed",
  user_login: "First login",
  job_applied: "Job application",
};

// GET /api/v1/admin/alerts, /api/v1/admin/alerts/unread-count
export interface AlertDTO {
  id: string;
  type: AlertType;
  message: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  read: boolean;
  createdAt: string;
}
