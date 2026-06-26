"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Plus, Eye, Heart, Clock, Play, Edit2, BarChart3, RefreshCw, Search } from "lucide-react";
import { formatNumber } from "@/utils";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  live: "bg-[#E50914]/15 text-[#E50914] border-[#E50914]/30",
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ended: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  cancelled: "bg-gray-600/15 text-gray-500 border-gray-600/30",
};
const STATUS_LABELS: Record<string, string> = { live: "AO VIVO", scheduled: "Agendado", ended: "Encerrado", cancelled: "Cancelado" };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CreatorLivesPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=100")
      .then((r) => setLives(r.items || []))
      .catch(() => setLives([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = lives.filter((l) => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || l.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: lives.length,
    live: lives.filter((l) => l.status === "live").length,
    scheduled: lives.filter((l) => l.status === "scheduled").length,
    ended: lives.filter((l) => l.status === "ended").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-violet-400" /> Minhas Lives
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{lives.length} live{lives.length !== 1 ? "s" : ""} no total</p>
        </div>
        <Link href="/admin/lives/new"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Nova Live
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar lives..."
            className="w-full bg-[#0E0E16] border border-[#1E1E2A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-violet-500/50 outline-none" />
        </div>
        <div className="flex gap-1">
          {Object.entries({ all: "Todas", live: "Ao Vivo", scheduled: "Agendadas", ended: "Encerradas" }).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${filter === k ? "bg-violet-600 text-white" : "bg-[#0E0E16] border border-[#1E1E2A] text-gray-400 hover:text-white"}`}>
              {v} {counts[k as keyof typeof counts] > 0 && <span className="opacity-60">({counts[k as keyof typeof counts]})</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-[#0E0E16] border border-[#1E1E2A] rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
          <Radio className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma live encontrada</p>
          <Link href="/admin/lives/new" className="mt-2 inline-block text-xs text-violet-400 hover:underline">Criar primeira live</Link>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
          <div className="divide-y divide-[#1E1E2A]">
            {filtered.map((live) => (
              <div key={live.id} className="flex items-center gap-4 p-4 hover:bg-[#111118] transition-colors">
                <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#1A1A28]">
                  {live.thumbnail ? (
                    <img src={live.thumbnail} alt={live.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Radio className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white truncate">{live.title}</p>
                    <span className={`flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${STATUS_STYLES[live.status] || STATUS_STYLES.ended}`}>
                      {STATUS_LABELS[live.status] || live.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{live.league || live.sport} · {formatDate(live.scheduledAt)}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(live.totalViews)}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(live.likeCount || 0)}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {live.status === "live" && (
                    <Link href={`/watch/${live.id}`}
                      className="p-2 rounded-lg bg-[#E50914]/10 hover:bg-[#E50914]/20 text-[#E50914] transition-colors" title="Ver live">
                      <Play className="w-4 h-4" />
                    </Link>
                  )}
                  <Link href={`/admin/lives/${live.id}`}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
