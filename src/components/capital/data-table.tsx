"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

type TableColumn<T> = {
  header: string;
  accessor: keyof T | string;
  sortable?: boolean;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
};

type EmptyState = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type DataTableProps<T> = {
  title: string;
  columns: TableColumn<T>[];
  data: T[];
  emptyState?: EmptyState;
  loading?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
};

export function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  emptyState,
  loading,
  searchPlaceholder = "Search…",
  pageSize = 6,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ accessor: string; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    setCurrentPage(0);
  }, [query, data]);

  const filtered = useMemo(() => {
    if (!query) return data;
    const normalized = query.trim().toLowerCase();
    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.accessor as keyof T] ?? "";
        if (typeof value === "string" || typeof value === "number") {
          return String(value).toLowerCase().includes(normalized);
        }
        return false;
      })
    );
  }, [columns, data, query]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    const { accessor, direction } = sortConfig;
    return [...filtered].sort((a, b) => {
      const aValue = a[accessor as keyof T] ?? "";
      const bValue = b[accessor as keyof T] ?? "";
      if (aValue === bValue) return 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      const aStr = String(aValue);
      const bStr = String(bValue);
      return direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [columns, filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const pageData = useMemo(() => {
    const start = currentPage * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [currentPage, pageSize, sorted]);

  const handleSort = (accessor: string) => {
    setSortConfig((prev) => {
      if (prev?.accessor === accessor) {
        return { accessor, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { accessor, direction: "asc" };
    });
  };

  const handleExport = useCallback(() => {
    if (typeof window === "undefined" || !window.Blob) return;
    const rows = [columns.map((col) => col.header).join(",")];
    const payload = sorted.map((row) =>
      columns
        .map((column) => {
          const value = row[column.accessor as keyof T];
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          return String(value);
        })
        .join(",")
    );
    const csv = [...rows, ...payload].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.replace(/\s+/g, "-").toLowerCase()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [columns, sorted, title]);

  return (
    <section className="rounded-[20px] border border-white/10 bg-white/90 p-6 shadow-[0_20px_35px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/80">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{sorted.length.toLocaleString()} record{sorted.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="rounded-lg border border-slate-200/80 bg-white/60 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-8 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
          ))}
        </div>
      ) : pageData.length === 0 ? (
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300/50 p-6 text-center text-sm text-slate-500 dark:border-slate-700/80 dark:text-slate-400">
          <p>{emptyState?.message ?? "No records yet."}</p>
          {emptyState?.actionLabel && emptyState?.onAction ? (
            <button
              type="button"
              onClick={emptyState.onAction}
              className="mx-auto rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-700"
            >
              {emptyState.actionLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead>
              <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className={`py-3 pr-4 font-semibold ${column.align === "right" ? "text-right" : "text-left"}`}
                  >
                    <button
                      type="button"
                      onClick={() => column.sortable && handleSort(String(column.accessor))}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      disabled={!column.sortable}
                    >
                      {column.header}
                      {sortConfig?.accessor === column.accessor ? (
                        <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      ) : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800/60 dark:text-white">
              {pageData.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                  {columns.map((column) => (
                    <td
                      key={`${column.header}-${rowIndex}`}
                      className={`whitespace-nowrap py-3 pr-4 align-top text-sm ${column.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {column.render ? column.render(row) : String(row[column.accessor as keyof T] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <p>
          Page {currentPage + 1} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            className="rounded-xl border border-slate-200 px-3 py-1 transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage >= totalPages - 1}
            className="rounded-xl border border-slate-200 px-3 py-1 transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export type { TableColumn };
