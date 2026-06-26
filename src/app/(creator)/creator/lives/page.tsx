"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Plus, Eye, Users, Settings, Play, Clock, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  live: "bg-[#E50914]/15 text-[#E50914] border-[#E50914]/20",
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  ended: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};
const STATUS_LABELS: Record<string, string> = { live: "AO VIVO", scheduled: "Agendado", ended: "Terminado" };
const STATUS_ICONS: Record<string, React.ElementType> = { live: Radio, scheduled: Clock, ended: CheckCircle };

export default function CreatorLivesPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ApiListResponse<Live>>("/lives?limit=50");
      setLives(data.items || []);
    } catch { toast.error("Erro ao carregar lives"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? lives : lives.filter((l) => l.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#E50914]" /> As Minhas Lives
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{lives.length} transmissão(ões) no total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link href="/admin/lives/new" className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] transition-colors">
            <Plus className="h-4 w-4" /> Nova Live
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "all", label: "Todas", count: lives.length },
          { key: "live", label: "Ao Vivo", count: lives.filter(l => l.status === "live").length },
          { key: "scheduled", label: "Agendadas", count: lives.filter(l => l.status === "scheduled").length },
          { key: "ended", label: "Terminadas", count: lives.filter(l => l.status === "ended").length },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === key ? "bg-[#E50914] text-white" : "bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] hover:text-white"
            }`}>
            {label}
            {count > 0 && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${filter === key ? "bg-white/20" : "bg-[#E50914]/20 text-[#E50914]"}`}>{count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
          <Radio className="h-12 w-12 opacity-20" />
          <p className="text-sm">Nenhuma live {filter !== "all" ? `com status "${filter}"` : ""}</p>
          <Link href="/admin/lives/new" className="text-[#E50914] text-sm hover:underline">Criar nova live</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((live) => {
            const StatusIcon = STATUS_ICONS[live.status] || Radio;
            return (
              <div key={live.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden hover:border-[#E50914]/20 transition-all group">
                {live.thumbnail && (
                  <div className="relative h-36 bg-[#1A1A1A]">
                    <img src={live.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    {live.status === "live" && (
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-black bg-[#E50914] text-white px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                          🔴 AO VIVO
                        </span>
                      </div>
                    )}
                    <Link href={`/watch/${live.id}`}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="rounded-full bg-[#E50914]/90 p-3">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                    </Link>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{live.title}</p>
                      {live.teamA && live.teamB && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{live.teamA} vs {live.teamB}</p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLORS[live.status]}`}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {STATUS_LABELS[live.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(live as any).totalViews || 0}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {live.viewerCount || 0}</span>
                    </div>
                    <Link href={`/admin/lives/${live.id}`} className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-all">
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
