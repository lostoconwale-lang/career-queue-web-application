// Client-side: when an API call comes back 401/403, the session is gone or the
// account lost access. Send the viewer to the "no access" page and tell the
// caller to stop processing the response. A full-page load (not router.push) is
// deliberate here — the session is gone, so we want a clean server render with
// no stale admin UI left mounted.
export function redirectOnDenied(res: Response): boolean {
  if (res.status !== 401 && res.status !== 403) return false;
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/no-access?code=${res.status}`;
  }
  return true;
}
