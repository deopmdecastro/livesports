"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Edit2, Trash2 } from "lucide-react";
import type { Competition } from "@/types";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";
import { formatDateTime, getSportLabel } from "@/utils";
import AdminActionButton from "@/components/admin/AdminActionButton";

const statusLabels: Record<string, string> = {
  active: "Ativa",
  draft: "Rascunho",
  completed: "Concluída",
};

const formatLabels: Record<string, string> = {
  groups: "Grupos",
  league: "Liga",
  knockout: "Taça",
};

export default function CompetitionsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    apiRequest<Competition[]>("/competitions")
      .then((data) => setCompetitions(data || []))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar competições"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return competitions;
    return competitions.filter((c) =>
      [c.name, c.slug, c.season || ""].some((v) => (v || "").toLowerCase().includes(query))
    );
  }, [competitions, q]);

  const handleDelete = async (competition: Competition) => {
    if (!window.confirm(`Remover a competição "${competition.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await apiRequest(`/competitions/${competition.id}`, { method: "DELETE" });
      setCompetitions((current) => current.filter((item) => item.id !== competition.id));
      toast.success("Competição removida!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a competição.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Competições</h2>
          <p className="text-xs text-gray-500">
            Gestão reaproveitável para torneios como Copa do Mundo, Eliminatórias, etc.
          </p>
        </div>
        <Link
          href="/admin/competitions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]"
        >
          <Plus className="h-4 w-4" /> Nova Competição
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#171717] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar competições..."
            className="input-dark w-full py-2.5 pl-9 pr-4 text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">{loading ? "A carregar..." : `${filtered.length} resultado(s)`}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#171717]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-white/10">
                {["Competição", "Formato", "Desporto", "Status", "Início", "Ações"].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="table-row-hover border-b border-white/10 last:border-0">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {c.season || "—"} · /{c.slug}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-gray-300">
                      {formatLabels[c.format || "groups"] || c.format}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-300">
                    {c.sport ? getSportLabel(c.sport) : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : c.status === "draft"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-400">
                    {c.startDate ? formatDateTime(c.startDate) : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <AdminActionButton
                        title="Ver página pública"
                        tone="view"
                        onClick={() => window.open(`/competicao/${c.slug}`, "_blank", "noopener,noreferrer")}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </AdminActionButton>
                      <AdminActionButton
                        title="Editar competição"
                        tone="edit"
                        onClick={() => router.push(`/admin/competitions/${c.id}`)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </AdminActionButton>
                      <AdminActionButton
                        title="Remover competição"
                        tone="danger"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AdminActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-400">Nenhuma competição encontrada.</div>
        )}
      </div>
    </div>
  );
}
