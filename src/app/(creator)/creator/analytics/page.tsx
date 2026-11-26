"use client";

import { useEffect, useState } from "react";
import { BarChart3, Eye, Users, Radio, Heart } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { apiRequest } from "@/lib/api";

interface Stats {
  totalLives: number;
  liveNow: number;
  totalViews: number;
  currentViewers: number;
  totalLikes: number;
  subscribers: number;
  channelViews: number;
  channelLiveCount: number;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color = "#E50914",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{title}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black tabular-nums text-white">{value}</p>
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[#1E1E2A]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#1E1E2A]" />
          ))}
        </div>
      </div>
    );
  }

  const hasActivity = Boolean(stats && (stats.totalLives > 0 || stats.totalViews > 0));
  const chartData = [
    { name: "Lives", value: stats?.totalLives || 0 },
    { name: "Views", value: Math.min(stats?.totalViews || 0, 9999) },
    { name: "Subs", value: stats?.subscribers || 0 },
    { name: "Likes", value: stats?.totalLikes || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white sm:text-2xl">Analíticas</h1>
        <p className="mt-1 text-sm text-gray-500">Desempenho do teu canal</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard title="Lives" value={stats?.totalLives || 0} icon={Radio} />
        <MetricCard title="Views" value={(stats?.totalViews || 0).toLocaleString("pt-PT")} icon={Eye} color="#22C55E" />
        <MetricCard title="Subscritores" value={(stats?.subscribers || 0).toLocaleString("pt-PT")} icon={Users} color="#38BDF8" />
        <MetricCard title="Gostos" value={(stats?.totalLikes || 0).toLocaleString("pt-PT")} icon={Heart} color="#F472B6" />
      </div>

      <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-bold text-white">Resumo</h2>
        {hasActivity ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0E0E16",
                    border: "1px solid #1E1E2A",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#E50914" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="mb-3 h-8 w-8 text-gray-600" />
            <p className="text-sm font-semibold text-white">Ainda sem dados suficientes</p>
            <p className="mt-1 max-w-sm text-xs text-gray-500">
              Quando as tuas lives tiverem audiência, o gráfico e as métricas aparecem aqui.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Viewers agora</p>
          <p className="mt-1 text-3xl font-black text-white">{(stats?.currentViewers || 0).toLocaleString("pt-PT")}</p>
        </div>
        <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Views do canal</p>
          <p className="mt-1 text-3xl font-black text-white">{(stats?.channelViews || 0).toLocaleString("pt-PT")}</p>
        </div>
      </div>
    </div>
  );
}
