import { SearchGlass } from "@/app/_components/Icons";

type Props = {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export function EmptyState({ hasActiveFilters, onClearFilters }: Props) {
  return (
    <div className="border-line bg-surface rounded-card flex flex-col items-center border border-dashed px-6 py-20 text-center">
      <span className="bg-brand-soft text-brand grid h-14 w-14 place-items-center rounded-full">
        <SearchGlass className="h-6 w-6" />
      </span>
      <h3 className="font-display text-ink mt-5 text-xl font-semibold">
        {hasActiveFilters ? "No roles match your filters" : "No open roles right now"}
      </h3>
      <p className="text-muted mt-2 max-w-sm text-sm leading-relaxed">
        {hasActiveFilters
          ? "Try a broader search or clearing a filter to see more open positions."
          : "Check back soon — new roles are added all the time."}
      </p>
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="bg-brand text-surface shadow-soft mt-6 rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          Clear all filters
        </button>
      ) : null}
    </div>
  );
}
