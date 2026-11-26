"use client";

import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  /** Hide column on small screens */
  hideOnMobile?: boolean;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  keyField?: string;
}

export default function AdminDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  searchKeys,
  pageSize = 20,
  emptyMessage = "Nenhum dado encontrado",
  onRowClick,
  keyField = "id",
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = [...data];
    if (search && searchKeys) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((key) => String(item[key] || "").toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const va = String(a[sortKey] || "");
        const vb = String(b[sortKey] || "");
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return result;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-3">
      {searchable && searchKeys && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Pesquisar..."
            className="input-dark w-full py-2.5 pl-9 pr-4 text-sm"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#1E1E2A] bg-[#0C0C12]">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-[#1E1E2A] bg-[#0A0A0F]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`sticky top-0 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 ${
                    col.hideOnMobile ? "hidden md:table-cell" : ""
                  } ${col.className || ""}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-white"
                    >
                      {col.header}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A2A]">
            {paged.length > 0 ? (
              paged.map((item, idx) => (
                <tr
                  key={String(item[keyField] || idx)}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors hover:bg-white/[0.03] ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-gray-300 ${
                        col.hideOnMobile ? "hidden md:table-cell" : ""
                      }`}
                    >
                      {col.render ? col.render(item) : String(item[col.key] || "")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <p className="text-sm font-medium text-gray-400">{emptyMessage}</p>
                  <p className="mt-1 text-xs text-gray-600">Ajuste os filtros ou adicione novos registos.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
            {totalPages > 1 ? ` · página ${page + 1} de ${totalPages}` : ""}
          </span>
          {totalPages > 1 ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 hover:bg-[#1A1A1A] disabled:opacity-30"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[4rem] text-center font-medium text-gray-300">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 hover:bg-[#1A1A1A] disabled:opacity-30"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
