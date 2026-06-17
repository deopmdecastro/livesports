"use client";

import { useEffect, useMemo, useState } from "react";
import React from "react";
import {
  Users, Radio, Eye, DollarSign, TrendingUp, TrendingDown,
  ArrowUpRight, Plus, Edit2, Trash2, AlertCircle, Activity,
  MousePointerClick, BarChart3, RefreshCw, Zap, Clock,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
} from "recharts";
import { formatNumber, formatCurrency, formatRelativeTime } from "@/utils";
import { apiRequest, type ApiListResponse } from "@/lib/api";
import type { Ad, DashboardStats, DeviceStats, Event, Live, User, ViewsChartData } from "@/types";
import Link from "next/link";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEVICE_COLORS = ["#E50914", "#3B82F6", "#22C55E", "#F59E0B"];

const emptyStats: DashboardStats = {
  totalUsers: 0, totalUsersGrowth: 0,
  livesTransmitted: 0, livesGrowth: 0,
  totalViews: 0, viewsGrowth: 0,
  adsRevenue: 0, revenueGrowth: 0,
};

const emptyDevices: DeviceStats = { mobile: 0, desktop: 0, smartTv: 0, tablet: 0 };

// ─── Skeleton loader ───────────────────────────────────────────────────────────

function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#1E1E2A] ${className}`} style={style} />;
}

function StatCardSkeleton() {
  return (
    <div className="stat-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return <Skeleton className={`w-full`} style={{ height }} />;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  growth: number;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
  accentColor?: string;
  subtitle?: string;
}

function StatCard({
  title, value, growth, icon: Icon,
  prefix = "", suffix = "", accentColor = "#E50914", subtitle,
}: StatCardProps) {
  const isPositive = growth >= 0;
  return (
    <div className="stat-card p-5 hover:border-[#E50914]/20 transition-colors group">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 font-heading text-2xl font-black text-white">
            {prefix}{typeof value === "number" ? formatNumber(value) : value}
            {suffix && <span className="ml-1 text-sm font-normal text-gray-400">{suffix}</span>}
          </p>
          {subtitle && <p className="mt-0.5 text-[10px] text-gray-600">{subtitle}</p>}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="h-5 w-5" style={{ color: accentColor }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isPositive
          ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
        <span className={`text-xs font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}{growth}%
        </span>
        <span className="text-xs text-gray-600">vs mes anterior</span>
      </div>
    </div>
  );
}

// ─── Metric pill ──────────────────────────────────────────────────────────────

function MetricPill({ label, value, color = "text-gray-300" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1E1E2A] last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Date label ───────────────────────────────────────────────────────────────

function dateLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === tomorrow.toDateString()) return "Amanha";
  return date.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "2-digit" });
}

const positionLabels: Record<string, string> = {
  header: "Topo",
  sidebar: "Sidebar",
  footer: "Rodape",
  "in-content": "Conteudo",
  in_content: "Conteudo",
  player: "Player",
  popup: "Popup",
};

function positionLabel(position: string) {
  return positionLabels[position] || position;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    live: "bg-[#E50914]/15 text-[#E50914] border-[#E50914]/20",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    ended: "bg-gray-500/15 text-gray-400 border-gray-500/20",
    paused: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    expired: "bg-gray-600/15 text-gray-500 border-gray-600/20",
    finished: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };
  const cls = map[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [viewsChart, setViewsChart] = useState<ViewsChartData[]>([]);
  const [devices, setDevices] = useState<DeviceStats>(emptyDevices);
  const [lives, setLives] = useState<Live[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setError("");
      const [statsData, chartData, deviceData, livesData, eventsData, usersData, adsData] =
        await Promise.all([
          apiRequest<DashboardStats>("/dashboard/stats"),
          apiRequest<ViewsChartData[]>("/dashboard/charts/views"),
          apiRequest<DeviceStats>("/dashboard/charts/devices"),
          apiRequest<ApiListResponse<Live>>("/lives?limit=100"),
          apiRequest<Event[]>("/events"),
          apiRequest<ApiListResponse<User>>("/users?limit=100"),
          apiRequest<Ad[]>("/ads"),
        ]);

      setStats(statsData);
      setViewsChart(chartData);
      setDevices({ ...emptyDevices, ...deviceData });
      setLives(livesData.items || []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setUsers(usersData.items || []);
      setAds(Array.isArray(adsData) ? adsData : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Derived data ────────────────────────────────────────────────────────────

  const deviceData = useMemo(() =>
    [
      { name: "Mobile", value: devices.mobile || 0 },
      { name: "Desktop", value: devices.desktop || 0 },
      { name: "Smart TV", value: devices.smartTv || 0 },
      { name: "Tablet", value: devices.tablet || 0 },
    ].filter((item) => item.value > 0),
    [devices],
  );

  const topLives = useMemo(() =>
    [...lives]
      .sort((a, b) => (b.viewerCount || b.totalViews || 0) - (a.viewerCount || a.totalViews || 0))
      .slice(0, 5),
    [lives],
  );

  const liveLives = useMemo(() => lives.filter((l) => l.status === "live"), [lives]);

  const upcomingEvents = useMemo(() =>
    [...events]
      .filter((event) => event.status !== "finished")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5),
    [events],
  );

  const recentUsers = useMemo(() =>
    [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [users],
  );

  const activeAds = useMemo(() => ads.filter((ad) => ad.status === "active"), [ads]);
  const totalRevenue = useMemo(() => ads.reduce((sum, ad) => sum + (ad.revenue || 0), 0), [ads]);
  const totalImpressions = useMemo(() => ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0), [ads]);
  const totalClicks = useMemo(() => ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0), [ads]);
  const overallCtr = useMemo(() =>
    totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
    [totalImpressions, totalClicks],
  );

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

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        {/* Stats skeletons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5 lg:col-span-2 space-y-3">
            <Skeleton className="h-4 w-36" />
            <ChartSkeleton height={200} />
          </div>
          <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <ChartSkeleton height={200} />
          </div>
        </div>

        {/* Tables skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
              <div className="p-4 border-b border-[#1E1E2A]"><Skeleton className="h-4 w-32" /></div>
              <div className="p-3 space-y-3">
                {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-8 w-full" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200 max-w-lg w-full">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Erro ao carregar dashboard</p>
            <p className="text-sm text-red-200/80 mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={() => loadDashboard()}
          className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Dashboard</h1>
          <p className="text-xs text-gray-500">
            {lastUpdated
              ? `Atualizado ${lastUpdated.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`
              : "A carregar dados em tempo real"}
            {liveLives.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#E50914]/15 px-2 py-0.5 text-[10px] font-bold text-[#E50914]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E50914] animate-pulse" />
                {liveLives.length} AO VIVO
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:border-[#E50914]/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "A atualizar..." : "Atualizar"}
          </button>
          <Link
            href="/admin/lives/new"
            className="flex items-center gap-2 rounded-xl bg-[#E50914] px-3 py-2 text-xs font-bold text-white hover:bg-[#B00000] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Nova Live
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Utilizadores" value={stats.totalUsers} growth={stats.totalUsersGrowth}
          icon={Users} subtitle={`${users.filter((u) => u.status === "active").length} ativos`}
        />
        <StatCard
          title="Lives Transmitidas" value={stats.livesTransmitted} growth={stats.livesGrowth}
          icon={Radio} accentColor="#3B82F6"
          subtitle={liveLives.length > 0 ? `${liveLives.length} ao vivo agora` : "Nenhuma ao vivo"}
        />
        <StatCard
          title="Visualizacoes" value={stats.totalViews} growth={stats.viewsGrowth}
          icon={Eye} accentColor="#22C55E"
          subtitle="Total acumulado"
        />
        <StatCard
          title="Receita (Ads)" value={formatCurrency(stats.adsRevenue)} growth={stats.revenueGrowth}
          icon={DollarSign} accentColor="#F59E0B"
          subtitle={`${activeAds.length} anuncios ativos`}
        />
      </div>

      {/* ── Ad Metrics summary row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Impressoes", value: formatNumber(totalImpressions), icon: Activity, color: "text-blue-400" },
          { label: "Cliques", value: formatNumber(totalClicks), icon: MousePointerClick, color: "text-emerald-400" },
          { label: "CTR Global", value: `${overallCtr}%`, icon: BarChart3, color: "text-yellow-400" },
          { label: "Receita Total", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] px-4 py-3">
            <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">{label}</p>
              <p className={`text-sm font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Views area chart */}
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Visualizacoes</h3>
              <p className="text-xs text-gray-500">Ultimos 7 dias</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="h-2 w-2 rounded-full bg-[#E50914]" /> Views
            </div>
          </div>
          {viewsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={viewsChart}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E50914" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
                <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4B5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={45} />
                <Tooltip
                  contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: "10px", fontSize: 11 }}
                  labelStyle={{ color: "#9CA3AF" }}
                  formatter={(v: number) => [formatNumber(v), "Views"]}
                />
                <Area type="monotone" dataKey="views" stroke="#E50914" strokeWidth={2} fill="url(#viewsGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-gray-600">
              <Activity className="h-8 w-8 opacity-30" />
              <p className="text-sm">Sem dados de visualizacoes ainda</p>
            </div>
          )}
        </div>

        {/* Device donut */}
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Dispositivos</h3>
            <p className="text-xs text-gray-500">Distribuicao de acessos</p>
          </div>
          {deviceData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={deviceData} cx="50%" cy="50%"
                    innerRadius={42} outerRadius={65}
                    paddingAngle={3} dataKey="value"
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: "10px" }}
                    itemStyle={{ color: "#fff", fontSize: 11 }}
                    formatter={(v: number) => [`${v}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 w-full space-y-1.5">
                {deviceData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[i] }} />
                      <span className="text-xs text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[190px] flex-col items-center justify-center gap-2 text-gray-600">
              <BarChart3 className="h-8 w-8 opacity-30" />
              <p className="text-sm text-center">Sem dados de dispositivos</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Live + Events + Users tables ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top Lives */}
        <div className="overflow-hidden rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
          <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-[#E50914]" /> Top Lives
            </h3>
            <Link href="/admin/lives" className="flex items-center gap-1 text-xs text-[#E50914] hover:underline">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#1A1A2A]">
            {topLives.length > 0 ? topLives.map((live, idx) => (
              <div key={live.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors">
                <span className="flex-shrink-0 w-5 text-center text-[10px] font-black text-gray-700">#{idx + 1}</span>
                <div className="h-8 w-12 flex-shrink-0 overflow-hidden rounded bg-[#1E1E2A]">
                  {live.thumbnail
                    ? <img src={live.thumbnail} alt="" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center"><Radio className="h-3 w-3 text-gray-600" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{live.title}</p>
                  <p className="text-[10px] text-gray-600">{live.league || live.sport}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <StatusBadge status={live.status} />
                  <span className="text-[10px] font-bold text-[#E50914]">
                    {formatNumber(live.viewerCount || live.totalViews || 0)}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-600">
                <Radio className="h-6 w-6 opacity-30" />
                <p className="text-sm">Nenhuma live registada</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="overflow-hidden rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
          <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-blue-400" /> Proximos Eventos
            </h3>
            <Link href="/admin/events" className="flex items-center gap-1 text-xs text-[#E50914] hover:underline">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#1A1A2A]">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event) => {
              const date = new Date(event.scheduledAt);
              return (
                <div key={event.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">
                      {event.teamA && event.teamB ? `${event.teamA} vs ${event.teamB}` : event.title}
                    </p>
                    <p className="text-[10px] text-gray-600">{event.league || event.sport}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-semibold text-gray-300">{dateLabel(event.scheduledAt)}</p>
                    <p className="text-[10px] text-gray-600">
                      {date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-600">
                <Clock className="h-6 w-6 opacity-30" />
                <p className="text-sm">Sem eventos futuros</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="overflow-hidden rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
          <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-emerald-400" /> Utilizadores Recentes
            </h3>
            <Link href="/admin/users" className="flex items-center gap-1 text-xs text-[#E50914] hover:underline">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#1A1A2A]">
            {recentUsers.length > 0 ? recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-7 w-7 flex-shrink-0 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1E1E2A] text-xs font-black text-gray-300 border border-white/10">
                    {user.name?.slice(0, 1).toUpperCase() || "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                  <p className="truncate text-[10px] text-gray-600">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <StatusBadge status={user.status} />
                  <span className="text-[10px] text-gray-600">{formatRelativeTime(user.createdAt)}</span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-600">
                <Users className="h-6 w-6 opacity-30" />
                <p className="text-sm">Nenhum utilizador encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Ads table ───────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
        <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-yellow-400" /> Anuncios Ativos
            </h3>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {activeAds.length} ativos · CTR medio {overallCtr}% · {formatNumber(totalImpressions)} impressoes
            </p>
          </div>
          <Link
            href="/admin/ads"
            className="flex items-center gap-1.5 rounded-lg bg-[#E50914] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B00000] transition-colors"
          >
            <Plus className="h-3 w-3" /> Novo Anuncio
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E1E2A]">
                {["Titulo", "Posicao", "Impressoes", "Cliques", "CTR", "Receita", "Status", "Acoes"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeAds.length > 0 ? activeAds.map((ad) => (
                <tr key={ad.id} className="border-b border-[#1A1A2A] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-white">{ad.title}</p>
                    <p className="text-[10px] text-gray-600">{ad.campaign || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{positionLabel(ad.position)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-200">{formatNumber(ad.impressions || 0)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-200">{formatNumber(ad.clicks || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${Number(ad.ctr) >= 2 ? "text-emerald-400" : Number(ad.ctr) >= 1 ? "text-yellow-400" : "text-gray-400"}`}>
                      {ad.ctr}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">{formatCurrency(ad.revenue || 0)}</td>
                  <td className="px-4 py-3"><StatusBadge status={ad.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link href="/admin/ads" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Link>
                      <Link href="/admin/ads" className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      <BarChart3 className="h-8 w-8 opacity-30" />
                      <p className="text-sm">Nenhum anuncio ativo</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Revenue + Ads performance charts ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue bar chart */}
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Receita por Periodo</h3>
            <p className="mt-1 text-2xl font-black text-white">{formatCurrency(totalRevenue)}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              {ads.length} anuncios no sistema
            </p>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={viewsChart}>
              <Bar dataKey="revenue" fill="#E50914" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Tooltip
                contentStyle={{ background: "#111118", border: "1px solid #1E1E2A", borderRadius: "10px" }}
                formatter={(v: number) => [formatCurrency(v), "Receita"]}
                labelStyle={{ color: "#9CA3AF", fontSize: 11 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ads performance by position */}
        <div className="overflow-hidden rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
          <div className="border-b border-[#1E1E2A] p-4">
            <h3 className="text-sm font-bold text-white">Performance por Posicao</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E1E2A]">
                  {["Posicao", "Impressoes", "Cliques", "CTR", "Receita"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adsPerformance.length > 0 ? adsPerformance.map((row) => (
                  <tr key={row.pos} className="border-b border-[#1A1A2A] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-300">{row.pos}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatNumber(row.imp)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatNumber(row.clk)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${row.ctr >= 2 ? "text-emerald-400" : row.ctr >= 1 ? "text-yellow-400" : "text-gray-500"}`}>
                        {row.ctr}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatCurrency(row.revenue)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-600">
                      Sem dados de performance de ads
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Quick access links ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/admin/lives", label: "Gerenciar Lives", icon: Radio, count: lives.length, color: "text-[#E50914]" },
          { href: "/admin/events", label: "Gerenciar Eventos", icon: Zap, count: events.length, color: "text-blue-400" },
          { href: "/admin/users", label: "Gerenciar Utilizadores", icon: Users, count: users.length, color: "text-emerald-400" },
          { href: "/admin/ads", label: "Gerenciar Anuncios", icon: BarChart3, count: ads.length, color: "text-yellow-400" },
        ].map(({ href, label, icon: Icon, count, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 hover:border-[#E50914]/20 transition-all"
          >
            <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{label}</p>
              <p className="text-[10px] text-gray-600">{count} registos</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-[#E50914] ml-auto flex-shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
