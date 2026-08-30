export function JobCardSkeleton({ view }: { view: "list" | "grid" }) {
  const isGrid = view === "grid";
  return (
    <div
      aria-hidden
      className={`rounded-card border-line bg-surface animate-pulse border p-5 sm:p-6 ${
        isGrid ? "h-full" : ""
      }`}
    >
      <div className={`flex items-center gap-3 ${isGrid ? "" : "sm:items-start"}`}>
        <div className="bg-cream h-14 w-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="bg-cream h-3 w-1/3 rounded-full" />
          <div className="bg-cream h-4 w-2/3 rounded-full" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="bg-cream h-3 w-full rounded-full" />
        <div className="bg-cream h-3 w-5/6 rounded-full" />
      </div>
      <div className="mt-5 flex gap-2.5">
        <div className="bg-cream h-9 w-20 rounded-full" />
        <div className="bg-cream h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}
