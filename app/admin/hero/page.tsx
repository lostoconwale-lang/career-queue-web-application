import { HeroForm } from "./HeroForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use /api/v1/hero (admin-only).
export default function HeroPage() {
  return <HeroForm />;
}
