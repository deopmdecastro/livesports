"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Eye, Users, Heart, Share2, Clock, BarChart3, Radio, ArrowUpRight } from "lucide-react";
import { formatNumber } from "@/utils";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

const generateMockData = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit" }),
      views: Math.floor(Math.random() * 5000) + 500,
      viewers: Math.floor(Math.random() * 1000) + 100,
    };
  });

export default function CreatorAnalyticsPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData] = useState(generateMockData);

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=100")
      .then((r) => setLives(r.items || []))
      .catch(() => setLives([]))
      .finally(() => setLoading(false));
  }, []);

  const totalViews = lives.reduce((s, l) => s + (l.totalViews || 0), 0);
  const totalLikes = lives.reduce((s, l) => s + (l.likeCount || 0), 0);
  const totalShares = lives.reduce((s, l) => s + (l.shareCount || 0), 0);
  const avgViewers = lives.length > 0 ? Math.round(lives.reduce((s, l) => s + l.viewerCount, 0) / lives.length) : 0;

  const topLives = [...lives]
    .sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-400" /> Analytics
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Estatísticas das tuas transmissões</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Visualizações", value: formatNumber(totalViews), icon: Eye, color: "#3B82F6", growth: "+12%" },
          { label: "Média Espectadores", value: formatNumber(avgViewers), icon: Users, color: "#22C55E", growth: "+8%" },
          { label: "Total Gostos", value: formatNumber(totalLikes), icon: Heart, color: "#EC4899", growth: "+23%" },
          { label: "Partilhas", value: formatNumber(totalShares), icon: Share2, color: "#F59E0B", growth: "+5%" },
        ].map(({ label, value, icon: Icon, color, growth }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-[10px] font-bold text-emerald-400">{growth}</span>
            </div>
            <p className="text-xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Visualizações</h3>
              <p className="text-xs text-gray-500">Últimos 7 dias</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
              <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4B5563", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: "10px", fontSize: 11 }}
                labelStyle={{ color: "#9CA3AF" }} />
              <Area type="monotone" dataKey="views" stroke="#7C3AED" strokeWidth={2} fill="url(#viewsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Espectadores/Dia</h3>
            <p className="text-xs text-gray-500">Média diária</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
              <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4B5563", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: "10px", fontSize: 11 }} />
              <Bar dataKey="viewers" fill="#7C3AED" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
        <div className="p-4 border-b border-[#1E1E2A] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Top Lives por Visualizações</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-[#1A1A28] animate-pulse rounded-lg" />)}
          </div>
        ) : topLives.length === 0 ? (
          <div className="py-10 text-center">
            <Radio className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Sem dados disponíveis</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E1E2A]">
            {topLives.map((live, i) => (
              <div key={live.id} className="flex items-center gap-4 p-4">
                <span className="text-lg font-black text-gray-700 w-6 flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{live.title}</p>
                  <p className="text-xs text-gray-500">{live.league || live.sport}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(live.totalViews)}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(live.likeCount || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
