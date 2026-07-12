"use client";

import { useEffect, useState } from "react";
import { BarChart3, Eye, Users, TrendingUp, Radio, Heart, Calendar } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>;

  const hasActivity = Boolean(stats && (stats.totalLives > 0 || stats.totalViews > 0));

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
        <MetricCard title="Subscritores" value={(stats?.subscribers || 0).toLocaleString()} icon={Users} color="#E50914" />
        <MetricCard title="Gostos" value={(stats?.totalLikes || 0).toLocaleString()} icon={Heart} color="#F59E0B" />
      </div>

      {!hasActivity ? (
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-10 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-gray-600" />
          <p className="mt-3 text-sm font-semibold text-white">Ainda sem dados suficientes</p>
          <p className="mt-1 text-xs text-gray-500">
            Os gráficos de desempenho aparecem aqui assim que o teu canal tiver lives e visualizações registadas.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
          <h3 className="text-sm font-bold text-white mb-4">Resumo do canal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { label: "Views totais", value: stats?.totalViews || 0 },
                { label: "Espectadores atuais", value: stats?.currentViewers || 0 },
                { label: "Gostos", value: stats?.totalLikes || 0 },
                { label: "Subscritores", value: stats?.subscribers || 0 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
              <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: "10px" }}
                labelStyle={{ color: "#9CA3AF" }} itemStyle={{ color: "#E50914" }} />
              <Bar dataKey="value" fill="#E50914" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-3 text-[11px] text-gray-500">
            Baseado nos totais reais dos últimos 30 dias. Um histórico diário detalhado ainda não está disponível.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-red-400" /> Dicas para Melhorar
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
