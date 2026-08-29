import { CityList } from "./CityList";

export const runtime = "nodejs";

// Access is enforced by app/admin/layout.tsx. Data + mutations use
// /api/v1/cities and /api/v1/cities/:id (admin-only).
export default function CitiesPage() {
  return <CityList />;
}
