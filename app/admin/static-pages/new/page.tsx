import { StaticPageForm } from "../StaticPageForm";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Submits POST /api/v1/static-pages.
export default function NewStaticPagePage() {
  return <StaticPageForm />;
}
