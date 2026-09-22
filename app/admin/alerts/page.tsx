import { Alerts } from "./Alerts";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data: GET /api/v1/admin/alerts.
export default function AdminAlertsPage() {
  return <Alerts />;
}
