export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={className}>
      <rect width="40" height="40" rx="12" fill="#6C4DFF" />
      <rect x="9" y="8.5" width="22" height="7" rx="3.5" fill="#FFFFFF" opacity="0.42" />
      <rect x="9" y="17" width="22" height="7" rx="3.5" fill="#FFFFFF" opacity="0.7" />
      <rect x="9" y="25.5" width="22" height="7" rx="3.5" fill="#FFFFFF" />
      <circle cx="13.4" cy="29" r="2" fill="#FF6B4A" />
    </svg>
  );
}

export default function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      {/* <LogoMark className="h-9 w-9" /> */}
      <span className="font-display text-ink text-2xl leading-none font-semibold tracking-tight">
        CareerQueue
      </span>
    </span>
  );
}
