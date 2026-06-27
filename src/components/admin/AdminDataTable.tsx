"use client";

import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
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
  columns, data, searchable = true, searchKeys,
  pageSize = 20, emptyMessage = "Nenhum dado encontrado",
  onRowClick, keyField = "id",
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

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div className="space-y-3">
      {searchable && searchKeys && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Pesquisar..."
            className="input-dark w-full pl-9 pr-4 py-2 text-sm"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#1E1E2A]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E1E2A] bg-[#0A0A0F]">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 ${col.className || ""}`}>
                  {col.sortable ? (
                    <button onClick={() => handleSort(col.key)} className="flex items-center gap-1 hover:text-white transition-colors">
                      {col.header}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A2A]">
            {paged.length > 0 ? paged.map((item, idx) => (
              <tr key={String(item[keyField] || idx)}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-white/[0.02] transition-colors ${onRowClick ? "cursor-pointer" : ""}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                    {col.render ? col.render(item) : String(item[col.key] || "")}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-gray-600">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filtered.length} resultados</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-[#1A1A1A] disabled:opacity-30">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-[#1A1A1A] disabled:opacity-30">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
