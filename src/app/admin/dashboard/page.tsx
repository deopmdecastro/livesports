"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Radio, Eye, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, MoreHorizontal, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { formatNumber, formatCurrency, formatRelativeTime } from "@/utils";
import { apiRequest, type ApiListResponse } from "@/lib/api";
import type { Ad, DashboardStats, DeviceStats, Event, Live, User, ViewsChartData } from "@/types";
import Link from "next/link";

const DEVICE_COLORS = ["#E50914", "#3B82F6", "#22C55E", "#F59E0B"];

const emptyStats: DashboardStats = {
  totalUsers: 0,
  totalUsersGrowth: 0,
  livesTransmitted: 0,
  livesGrowth: 0,
  totalViews: 0,
  viewsGrowth: 0,
  adsRevenue: 0,
  revenueGrowth: 0,
};

const emptyDevices: DeviceStats = {
  mobile: 0,
  desktop: 0,
  smartTv: 0,
  tablet: 0,
};

function StatCard({ title, value, growth, icon: Icon, prefix = "", suffix = "" }: {
  title: string;
  value: number | string;
  growth: number;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
}) {
  const isPositive = growth >= 0;
  return (
    <div className="stat-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{title}</p>
          <p className="mt-1 font-heading text-2xl font-black text-white">
            {prefix}{typeof value === "number" ? formatNumber(value) : value}
            {suffix && <span className="ml-1 text-base font-normal text-gray-400">{suffix}</span>}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E50914]/10">
          <Icon className="h-5 w-5 text-[#E50914]" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isPositive ? <TrendingUp className="h-3.5 w-3.5 text-green-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
        <span className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}{growth}%
        </span>
        <span className="text-xs text-gray-500">vs mes anterior</span>
      </div>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5 text-sm text-gray-400">
      {label}
    </div>
  );
}

function dateLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === tomorrow.toDateString()) return "Amanha";
  return date.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function positionLabel(position: string) {
  const labels: Record<string, string> = {
    header: "Topo do Site",
    sidebar: "Sidebar",
    footer: "Rodape",
    "in-content": "Meio do Conteudo",
    in_content: "Meio do Conteudo",
    player: "Player",
    popup: "Popup",
  };
  return labels[position] || position;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [viewsChart, setViewsChart] = useState<ViewsChartData[]>([]);
  const [devices, setDevices] = useState<DeviceStats>(emptyDevices);
  const [lives, setLives] = useState<Live[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setError("");
        const [statsData, chartData, deviceData, livesData, eventsData, usersData, adsData] = await Promise.all([
          apiRequest<DashboardStats>("/dashboard/stats"),
          apiRequest<ViewsChartData[]>("/dashboard/charts/views"),
          apiRequest<DeviceStats>("/dashboard/charts/devices"),
          apiRequest<ApiListResponse<Live>>("/lives?limit=100"),
          apiRequest<Event[]>("/events"),
          apiRequest<ApiListResponse<User>>("/users?limit=100"),
          apiRequest<Ad[]>("/ads"),
        ]);

        if (!mounted) return;
        setStats(statsData);
        setViewsChart(chartData);
        setDevices({ ...emptyDevices, ...deviceData });
        setLives(livesData.items || []);
        setEvents(eventsData || []);
        setUsers(usersData.items || []);
        setAds(adsData || []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar o dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const deviceData = useMemo(() => [
    { name: "Mobile", value: devices.mobile || 0 },
    { name: "Desktop", value: devices.desktop || 0 },
    { name: "Smart TV", value: devices.smartTv || 0 },
    { name: "Tablet", value: devices.tablet || 0 },
  ].filter((item) => item.value > 0), [devices]);

  const topLives = useMemo(() => [...lives]
    .sort((a, b) => (b.viewerCount || b.totalViews || 0) - (a.viewerCount || a.totalViews || 0))
    .slice(0, 5), [lives]);

  const upcomingEvents = useMemo(() => [...events]
    .filter((event) => event.status !== "finished")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5), [events]);

  const recentUsers = useMemo(() => [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5), [users]);

  const activeAds = useMemo(() => ads.filter((ad) => ad.status === "active"), [ads]);
  const totalRevenue = useMemo(() => ads.reduce((sum, ad) => sum + (ad.revenue || 0), 0), [ads]);
  const adsPerformance = useMemo(() => {
    const grouped = new Map<string, { pos: string; imp: number; clk: number; revenue: number }>();
    ads.forEach((ad) => {
      const current = grouped.get(ad.position) || { pos: positionLabel(ad.position), imp: 0, clk: 0, revenue: 0 };
      current.imp += ad.impressions || 0;
      current.clk += ad.clicks || 0;
      current.revenue += ad.revenue || 0;
      grouped.set(ad.position, current);
    });
    return Array.from(grouped.values()).map((row) => ({
      ...row,
      ctr: row.imp > 0 ? Number(((row.clk / row.imp) * 100).toFixed(2)) : 0,
    }));
  }, [ads]);

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingBlock label="A carregar dados reais do dashboard..." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-[#1A1A1A]" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
        <AlertCircle className="h-5 w-5" />
        <div>
          <p className="font-semibold">Erro ao carregar dashboard</p>
          <p className="text-sm text-red-200/80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Utilizadores Totais" value={stats.totalUsers} growth={stats.totalUsersGrowth} icon={Users} />
        <StatCard title="Lives Transmitidas" value={stats.livesTransmitted} growth={stats.livesGrowth} icon={Radio} />
        <StatCard title="Visualizacoes" value={stats.totalViews} growth={stats.viewsGrowth} icon={Eye} />
        <StatCard title="Receita (Ads)" value={formatCurrency(stats.adsRevenue)} growth={stats.revenueGrowth} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Visualizacoes reais</h3>
              <p className="text-xs text-gray-400">Ultimos 7 dias</p>
            </div>
            <button className="rounded-lg p-1.5 text-gray-400 hover:bg-[#2A2A2A] hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={viewsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip
                contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "8px" }}
                labelStyle={{ color: "#9CA3AF", fontSize: 11 }}
                formatter={(v: number) => [formatNumber(v), "Visualizacoes"]}
              />
              <Line type="monotone" dataKey="views" stroke="#E50914" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Dispositivos</h3>
            <p className="text-xs text-gray-400">Baseado nas views reais</p>
          </div>
          {deviceData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {deviceData.map((_, index) => <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff", fontSize: 11 }}
                    formatter={(v: number) => [`${v}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 w-full space-y-2">
                {deviceData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DEVICE_COLORS[i] }} />
                      <span className="text-xs text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[190px] items-center justify-center text-sm text-gray-500">Sem views registadas ainda.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] p-4">
            <h3 className="text-sm font-semibold text-white">Lives Mais Assistidas</h3>
            <Link href="/admin/lives" className="flex items-center gap-1 text-xs text-[#E50914] hover:underline">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#2A2A2A]">
            {topLives.length > 0 ? topLives.map((live) => (
              <div key={live.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-[#2A2A2A]/30">
                <div className="h-8 w-12 flex-shrink-0 overflow-hidden rounded bg-[#2A2A2A]">
                  {live.thumbnail ? <img src={live.thumbnail} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{live.title}</p>
                  <p className="text-[10px] text-gray-400">{live.league || "Sem liga"}</p>
                </div>
                <span className="flex-shrink-0 text-xs font-bold text-[#E50914]">{formatNumber(live.viewerCount || live.totalViews || 0)}</span>
              </div>
            )) : <p className="p-4 text-sm text-gray-500">Nenhuma live cadastrada.</p>}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] p-4">
            <h3 className="text-sm font-semibold text-white">Eventos Futuros</h3>
            <Link href="/admin/events" className="flex items-center gap-1 text-xs text-[#E50914] hover:underline">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#2A2A2A]">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event) => {
              const date = new Date(event.scheduledAt);
              return (
                <div key={event.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-[#2A2A2A]/30">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white">{event.teamA && event.teamB ? `${event.teamA} vs ${event.teamB}` : event.title}</p>
                    <p className="text-[10px] text-gray-400">{event.league || "Sem liga"}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-medium text-gray-300">{dateLabel(event.scheduledAt)}</p>
                    <p className="text-[10px] text-gray-500">{date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              );
            }) : <p className="p-4 text-sm text-gray-500">Nenhum evento futuro.</p>}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] p-4">
            <h3 className="text-sm font-semibold text-white">Ultimos Utilizadores</h3>
            <Link href="/admin/users" className="flex items-center gap-1 text-xs text-[#E50914] hover:underline">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#2A2A2A]">
            {recentUsers.length > 0 ? recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-[#2A2A2A]/30">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-xs font-bold text-gray-300">
                    {user.name?.slice(0, 1) || "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{user.email}</p>
                  <p className="text-[10px] text-gray-400">{user.name}</p>
                </div>
                <span className="flex-shrink-0 text-[10px] text-gray-500">{formatRelativeTime(user.createdAt)}</span>
              </div>
            )) : <p className="p-4 text-sm text-gray-500">Nenhum utilizador encontrado.</p>}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] p-4">
          <h3 className="text-sm font-semibold text-white">Anuncios Ativos</h3>
          <Link href="/admin/ads" className="flex items-center gap-1.5 rounded-lg bg-[#E50914] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#B00000]">
            <Plus className="h-3 w-3" />
            Novo Anuncio
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["ID", "Titulo", "Posicao", "Impressoes", "Cliques", "CTR", "Status", "Acoes"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeAds.length > 0 ? activeAds.map((ad) => (
                <tr key={ad.id} className="table-row-hover border-b border-[#2A2A2A] last:border-0">
                  <td className="px-4 py-3 text-xs text-gray-400">{ad.id}</td>
                  <td className="px-4 py-3 text-xs font-medium text-white">{ad.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{positionLabel(ad.position)}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{ad.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{ad.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{ad.ctr}%</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">Ativo</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href="/admin/ads" className="p-1 text-gray-400 transition-colors hover:text-blue-400"><Edit2 className="h-3.5 w-3.5" /></Link>
                      <Link href="/admin/ads" className="p-1 text-gray-400 transition-colors hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">Nenhum anuncio ativo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Resumo de Receita (Ads)</h3>
            <p className="mt-1 text-2xl font-black text-white">{formatCurrency(totalRevenue)}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <TrendingUp className="h-3 w-3 text-green-400" /> Dados calculados pelos anuncios reais
            </p>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={viewsChart}>
              <Bar dataKey="revenue" fill="#E50914" radius={[3, 3, 0, 0]} />
              <Tooltip
                contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "8px" }}
                formatter={(v: number) => [formatCurrency(v), "Receita"]}
                labelStyle={{ color: "#9CA3AF", fontSize: 11 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="border-b border-[#2A2A2A] p-4">
            <h3 className="text-sm font-semibold text-white">Performance de Ads</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["Posicao", "Impressoes", "Cliques", "CTR"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adsPerformance.length > 0 ? adsPerformance.map((row) => (
                <tr key={row.pos} className="table-row-hover border-b border-[#2A2A2A] last:border-0">
                  <td className="px-4 py-3 text-xs text-gray-300">{row.pos}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{row.imp.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{row.clk.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{row.ctr}%</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">Sem dados de anuncios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
