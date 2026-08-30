import { Buildings } from "@/app/_components/Icons";

// Cycle through a few on-brand combinations so a page full of initials
// avatars doesn't read as monotone purple.
const PALETTE = [
  "bg-brand-soft text-brand",
  "bg-coral/10 text-coral",
  "bg-ink text-surface",
  "bg-cream text-ink border border-line",
];

function paletteFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0]!;
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return (words[0] ?? "").slice(0, 2).toUpperCase();
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

type Props = {
  /** A photo/thumbnail — rendered cropped to fill (`object-cover`), no padding. */
  photoUrl?: string | null;
  /** A logo/mark — rendered whole (`object-contain`) on a neutral tile. */
  logoUrl?: string | null;
  name: string;
  size?: number;
  className?: string;
};

// Falls back through: a job's own thumbnail photo -> the company's logo mark
// -> a deterministic initials avatar. Keeps every card visually complete even
// when no media has been uploaded for a job or its company.
export function CompanyLogo({ photoUrl, logoUrl, name, size = 56, className = "" }: Props) {
  const style = { width: size, height: size };

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        style={style}
        className={`border-line shrink-0 rounded-2xl border object-cover ${className}`}
      />
    );
  }

  if (logoUrl) {
    return (
      <span
        style={style}
        className={`border-line bg-cream shrink-0 overflow-hidden rounded-2xl border p-1.5 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }

  const initials = initialsFor(name);
  if (!initials) {
    return (
      <span
        style={style}
        className={`border-line bg-cream text-muted/50 shrink-0 grid place-items-center rounded-2xl border ${className}`}
      >
        <Buildings className="h-1/2 w-1/2" />
      </span>
    );
  }

  return (
    <span
      style={style}
      className={`shrink-0 grid place-items-center rounded-2xl text-sm font-semibold ${paletteFor(name)} ${className}`}
    >
      {initials}
    </span>
  );
}
