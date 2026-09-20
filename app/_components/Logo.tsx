export default function Logo({
  iconUrl,
  siteName = "CareerQueue",
  className,
}: {
  iconUrl?: string | null;
  siteName?: string;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" className="h-9 w-9 object-contain " />
      ) : null}
      <span className="font-display text-ink text-2xl leading-none font-semibold tracking-tight">
        {siteName}
      </span>
    </span>
  );
}
