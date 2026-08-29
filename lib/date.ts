// Date helpers for the browser: MongoDB/ISO timestamps → the viewer's own
// timezone, in a human-readable form. Safe to import from client components.

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_TIME: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

/** e.g. "28 Aug 2026, 3:45 PM" in the viewer's local timezone. */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat(undefined, DATE_TIME).format(date) : "—";
}

/** e.g. "28 Aug 2026" in the viewer's local timezone. */
export function formatDate(value: DateInput): string {
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date)
    : "—";
}

/** "just now", "5 minutes ago", "yesterday"… falling back to a full date past a week. */
export function formatRelativeTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "—";

  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 7 * 86_400) return rtf.format(Math.round(diffSec / 86_400), "day");
  return formatDateTime(date);
}
