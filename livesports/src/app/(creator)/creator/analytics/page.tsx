"use client";

import { useEffect, useState } from "react";
import { BarChart3, Eye, Users, TrendingUp, Radio, Heart, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { apiRequest } from "@/lib/api";

interface Stats {
  totalLives: number; liveNow: number; totalViews: number;
  currentViewers: number; totalLikes: number; subscribers: number;
  channelViews: number; channelLiveCount: number;
}

function MetricCard({ title, value, icon: Icon, color = "#E50914" }: {
  title: string; value: string | number; icon: React.ElementType; color?: string;
}) {
  return (
    <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export default function CreatorAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Stats>("/creator/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mockViewsData = [
    { day: "Seg", views: 320, viewers: 45 },
    { day: "Ter", views: 580, viewers: 78 },
    { day: "Qua", views: 420, viewers: 52 },
    { day: "Qui", views: 890, viewers: 120 },
    { day: "Sex", views: 1200, viewers: 165 },
    { day: "Sab", views: 1800, viewers: 240 },
    { day: "Dom", views: 2200, viewers: 310 },
  ];

  const mockLivesData = [
    { live: "Liga PT #1", views: 1240, duration: "2h 15m" },
    { live: "Champions #2", views: 980, duration: "1h 45m" },
    { live: "Libertadores", views: 756, duration: "2h 30m" },
    { live: "Bundesliga", views: 540, duration: "1h 50m" },
    { live: "Série A", views: 420, duration: "2h 05m" },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#E50914]" /> Analíticas
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Desempenho do teu canal nos últimos 30 dias</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard title="Lives" value={stats?.totalLives || 0} icon={Radio} />
        <MetricCard title="Views Totais" value={(stats?.totalViews || 0).toLocaleString()} icon={Eye} color="#22C55E" />
        <MetricCard title="Subscritores" value={(stats?.subscribers || 0).toLocaleString()} icon={Users} color="#3B82F6" />
        <MetricCard title="Gostos" value={(stats?.totalLikes || 0).toLocaleString()} icon={Heart} color="#F59E0B" />
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <h3 className="text-sm font-bold text-white mb-4">Visualizações da Semana</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={mockViewsData}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E50914" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
            <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: "10px" }}
              labelStyle={{ color: "#9CA3AF" }} itemStyle={{ color: "#E50914" }} />
            <Area type="monotone" dataKey="views" stroke="#E50914" strokeWidth={2} fill="url(#viewsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
          <h3 className="text-sm font-bold text-white mb-4">Espectadores por Dia</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={mockViewsData}>
              <Bar dataKey="viewers" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: "10px" }}
                labelStyle={{ color: "#9CA3AF" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
          <div className="p-4 border-b border-[#1E1E2A]">
            <h3 className="text-sm font-bold text-white">Top Lives</h3>
          </div>
          <div className="divide-y divide-[#1A1A2A]">
            {mockLivesData.map((live, i) => (
              <div key={live.live} className="flex items-center gap-3 p-3">
                <span className="text-xs font-black text-gray-600 w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{live.live}</p>
                  <p className="text-[10px] text-gray-500">{live.duration}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Eye className="h-3 w-3" />
                  <span className="text-xs font-bold">{live.views.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400" /> Dicas para Melhorar
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { label: "Horário ideal", desc: "Sábado e Domingo 20h-22h têm mais espectadores" },
            { label: "Duração mínima", desc: "Lives acima de 1h30 geram 3x mais subscritores" },
            { label: "Consistência", desc: "Transmitir 3+ vezes por semana aumenta retenção" },
          ].map(({ label, desc }) => (
            <div key={label} className="rounded-lg bg-[#1A1A2A] border border-[#2A2A3A] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-white">{label}</span>
              </div>
              <p className="text-[11px] text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
