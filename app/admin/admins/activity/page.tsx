import { ActivityLogs } from "./ActivityLogs";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data: GET /api/v1/admin/activity.
export default function AdminActivityPage() {
  return <ActivityLogs />;
}
