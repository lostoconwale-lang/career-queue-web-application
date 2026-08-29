import { SettingsForm } from "./SettingsForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + save use /api/v1/settings.
export default function SettingsPage() {
  return <SettingsForm />;
}
