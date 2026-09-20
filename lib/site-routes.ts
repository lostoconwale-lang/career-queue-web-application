export interface SiteRoute {
  path: string;
  label: string;
}

// Internal routes offered when picking a header link's destination. Add a new
// entry here whenever a new public page ships.
export const SITE_ROUTES: SiteRoute[] = [
  { path: "/", label: "Home" },
  { path: "/jobs", label: "Browse jobs" },
  { path: "/login", label: "Sign in" },
  { path: "/register", label: "Get started" },
];
