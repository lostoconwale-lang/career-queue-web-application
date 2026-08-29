import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Extra classes for both the header and body cells of this column. */
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  /** Minimum table width before the container scrolls horizontally. */
  minWidth?: number;
};

const alignClass = (align: Column<unknown>["align"]) =>
  align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

export function Table<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = "Nothing to show yet.",
  minWidth = 640,
}: Props<T>) {
  return (
    <div className="border-line bg-surface shadow-soft overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-line text-muted border-b">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 font-medium ${alignClass(column.align)} ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-muted px-4 py-10 text-center">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-muted px-4 py-10 text-center">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-cream/50 transition-colors">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`text-ink px-4 py-3 align-middle ${alignClass(column.align)} ${column.className ?? ""}`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
