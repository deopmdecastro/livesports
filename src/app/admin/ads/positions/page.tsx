"use client";

import { useEffect, useState } from "react";
import { MapPin, Edit2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface Position {
  id: string;
  position: string;
  label: string;
  adCount: number;
  activeCount: number;
  status: string;
}

const POSITION_LABELS: Record<string, string> = {
  header: "Topo global", sidebar: "Sidebar direita", in_content: "Meio do conteudo",
  player: "Player pre-roll", popup: "Popup/flutuante", footer: "Rodape global",
  live_preroll: "Pre-roll Live",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  inactive: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export default function AdPositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ data: Position[] }>("/ads/positions");
      const items = (data?.data || []).map((p: any) => ({
        ...p,
        label: POSITION_LABELS[p.position] || p.position,
      }));
      setPositions(items);
    } catch (err) {
      toast.error("Erro ao carregar posicoes");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const stats = {
    total: positions.length,
    active: positions.filter(p => p.activeCount > 0).length,
    totalAds: positions.reduce((s, p) => s + p.adCount, 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#E50914]" /> Posicoes de Ads
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{stats.total} posicoes · {stats.active} com ads ativos · {stats.totalAds} ads no total</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Posicoes", value: stats.total, color: "text-white" },
          { label: "Com ads", value: stats.active, color: "text-emerald-400" },
          { label: "Total ads", value: stats.totalAds, color: "text-[#E50914]" },
          { label: "Formatos", value: "4", color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <p className={`text-lg font-black ${color}`}>{value}</p>
            <p className="text-[10px] uppercase text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>
      ) : (
        <div className="space-y-3">
          {positions.map(p => (
            <div key={p.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 hover:border-[#E50914]/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{p.label}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${p.activeCount > 0 ? STATUS_COLORS.active : STATUS_COLORS.inactive}`}>
                      {p.activeCount > 0 ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{p.position} · {p.adCount} anúncios ({p.activeCount} ativos)</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{p.adCount}</p>
                    <p className="text-[10px] text-gray-500">Ads</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-400">{p.activeCount}</p>
                    <p className="text-[10px] text-gray-500">Ativos</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
