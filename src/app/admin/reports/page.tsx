"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, Users, Radio, Calendar } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface GamesReport {
  period: { from: string; to: string };
  summary: { total: number; liveNow: number; finished: number; upcoming: number; cancelled: number };
  bySport: { sport: string; count: number }[];
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
}

interface LivesReport {
  period: { from: string; to: string };
  summary: { total: number; liveNow: number; ended: number; totalViews: number; currentViewers: number; totalLikes: number };
  bySport: { sport: string; count: number; views: number }[];
  topViewed: { id: string; title: string; teamA?: string; teamB?: string; totalViews: number; viewerCount: number; status: string }[];
  dailyViews: { date: string; count: number; views: number }[];
}

interface UsersReport {
  summary: { total: number; active: number; suspended: number; verified: number; newThisPeriod: number };
  byRole: { role: string; count: number }[];
  registrationsByDay: { date: string; count: number }[];
}

const SPORT_LABELS: Record<string, string> = {
  football: "Futebol", basketball: "Basquete", tennis: "Ténis",
  ufc: "UFC", f1: "Fórmula 1", volleyball: "Voleibol", baseball: "Basebol", other: "Outros",
};

export default function ReportsPage() {
  const [tab, setTab] = useState<"games" | "lives" | "users">("games");
  const [gamesReport, setGamesReport] = useState<GamesReport | null>(null);
  const [livesReport, setLivesReport] = useState<LivesReport | null>(null);
  const [usersReport, setUsersReport] = useState<UsersReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [to] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const params = `?from=${from}&to=${to}`;
      if (tab === "games") {
        const data = await apiRequest<GamesReport>(`/reports/games${params}`);
        setGamesReport(data);
      } else if (tab === "lives") {
        const data = await apiRequest<LivesReport>(`/reports/lives${params}`);
        setLivesReport(data);
      } else {
        const data = await apiRequest<UsersReport>(`/reports/users${params}`);
        setUsersReport(data);
      }
    } catch { toast.error("Erro ao carregar relatório"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab, from]);

  const exportCsv = (data: object[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => (row as any)[h]).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Relatórios</h2>
          <p className="text-xs text-gray-400">Dados reais da base de dados</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-dark px-3 py-1.5 text-sm" />
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-sm text-white hover:bg-[#2A2A2A]">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[#2A2A2A]">
        {([["games", "Jogos", Calendar], ["lives", "Transmissões", Radio], ["users", "Utilizadores", Users]] as [string, string, any][]).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === k ? "border-b-2 border-[#E50914] text-white" : "text-gray-400 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{l}
          </button>
        ))}
      </div>

      {/* Games Report */}
      {tab === "games" && gamesReport && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: gamesReport.summary.total, color: "text-white" },
              { label: "Ao vivo", value: gamesReport.summary.liveNow, color: "text-red-400" },
              { label: "Finalizados", value: gamesReport.summary.finished, color: "text-green-400" },
              { label: "Agendados", value: gamesReport.summary.upcoming, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Por Desporto</h3>
                <button onClick={() => exportCsv(gamesReport.bySport, "jogos-por-desporto.csv")} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"><Download className="h-3 w-3" />CSV</button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gamesReport.bySport.map((r) => ({ ...r, sport: SPORT_LABELS[r.sport] || r.sport }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
                  <XAxis dataKey="sport" tick={{ fill: "#6B7280", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#E50914" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
              <h3 className="text-sm font-bold text-white mb-4">Por Fonte de Importação</h3>
              <div className="space-y-2">
                {gamesReport.bySource.map((r) => (
                  <div key={r.source} className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">{r.source}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#2A2A2A]">
                        <div className="h-full rounded-full bg-[#E50914]" style={{ width: `${Math.round((r.count / gamesReport.summary.total) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right">{r.count}</span>
                    </div>
                  </div>
                ))}
                {gamesReport.bySource.length === 0 && <p className="text-xs text-gray-500">Sem dados de importação</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lives Report */}
      {tab === "lives" && livesReport && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Total", value: livesReport.summary.total, color: "text-white" },
              { label: "Ao vivo", value: livesReport.summary.liveNow, color: "text-red-400" },
              { label: "Finalizadas", value: livesReport.summary.ended, color: "text-gray-400" },
              { label: "Visualizações", value: livesReport.summary.totalViews.toLocaleString(), color: "text-red-400" },
              { label: "Espectadores", value: livesReport.summary.currentViewers.toLocaleString(), color: "text-green-400" },
              { label: "Likes", value: livesReport.summary.totalLikes.toLocaleString(), color: "text-pink-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {livesReport.dailyViews.length > 0 && (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
              <h3 className="text-sm font-bold text-white mb-4">Visualizações por Dia</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={livesReport.dailyViews}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E50914" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
                  <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="views" stroke="#E50914" fill="url(#viewsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {livesReport.topViewed.length > 0 && (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Top Transmissões</h3>
                <button onClick={() => exportCsv(livesReport.topViewed, "top-lives.csv")} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"><Download className="h-3 w-3" />CSV</button>
              </div>
              <div className="space-y-2">
                {livesReport.topViewed.map((live, i) => (
                  <div key={live.id} className="flex items-center justify-between py-2 border-b border-[#2A2A2A] last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-600 w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-white truncate max-w-xs">{live.teamA && live.teamB ? `${live.teamA} vs ${live.teamB}` : live.title}</p>
                        <p className="text-[10px] text-gray-500">{live.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{live.totalViews.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500">visualizações</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Report */}
      {tab === "users" && usersReport && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total", value: usersReport.summary.total, color: "text-white" },
              { label: "Ativos", value: usersReport.summary.active, color: "text-green-400" },
              { label: "Verificados", value: usersReport.summary.verified, color: "text-red-400" },
              { label: "Suspensos", value: usersReport.summary.suspended, color: "text-yellow-400" },
              { label: "Novos (período)", value: usersReport.summary.newThisPeriod, color: "text-purple-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
              <h3 className="text-sm font-bold text-white mb-4">Por Função</h3>
              <div className="space-y-2">
                {usersReport.byRole.map((r) => (
                  <div key={r.role} className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 capitalize">{r.role.replace("_", " ")}</span>
                    <span className="text-sm font-bold text-white">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {usersReport.registrationsByDay.length > 0 && (
              <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                <h3 className="text-sm font-bold text-white mb-4">Registos por Dia</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={usersReport.registrationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
                    <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 9 }} />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#E50914" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
