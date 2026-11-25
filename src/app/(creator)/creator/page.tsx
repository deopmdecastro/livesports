"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Eye,
  Users,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Tv2,
  BarChart3,
  Star,
  Zap,
  AlertCircle,
  Heart,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface CreatorStats {
  totalLives: number;
  liveNow: number;
  totalViews: number;
  currentViewers: number;
  totalLikes: number;
  subscribers: number;
  channelViews: number;
  channelLiveCount: number;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  status: string;
  verified: boolean;
  subscriberCount: number;
  totalViews: number;
  liveCount: number;
  avatar?: string;
  description?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "#E50914",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-4 transition-colors hover:border-[#E50914]/25 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-white">{value}</p>
          {subtitle ? <p className="mt-0.5 text-[11px] text-gray-600">{subtitle}</p> : null}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [noChannel, setNoChannel] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, channelData] = await Promise.all([
          apiRequest<CreatorStats>("/creator/stats").catch(() => null),
          apiRequest<Channel>("/creator/channel").catch(() => null),
        ]);
        setStats(statsData);
        if (channelData) setChannel(channelData);
        else setNoChannel(true);
      } catch {
        setNoChannel(true);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#1E1E2A]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#1E1E2A]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {channel ? `Canal · ${channel.name}` : "Visão geral da tua atividade"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/creator/lives"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Radio className="h-4 w-4" />
            Lives
          </Link>
          <Link
            href="/creator/channel"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-3.5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_rgba(229,9,20,0.25)] transition hover:bg-[#C50010]"
          >
            <Plus className="h-4 w-4" />
            {channel ? "Gerir canal" : "Criar canal"}
          </Link>
        </div>
      </div>

      {noChannel || !channel ? (
        <div className="overflow-hidden rounded-2xl border border-[#E50914]/25 bg-gradient-to-br from-[#E50914]/10 to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E50914]/30 bg-[#E50914]/15 text-[#ff6b73]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Ainda não tens canal</h2>
                <p className="mt-1 max-w-md text-sm text-white/55">
                  Cria o teu canal para publicar lives, ver estatísticas e aparecer na plataforma.
                </p>
              </div>
            </div>
            <Link
              href="/creator/channel"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0A0A10] transition hover:bg-white/90"
            >
              <Tv2 className="h-4 w-4" />
              Configurar canal
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {channel.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={channel.avatar} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E50914]/15 text-[#E50914]">
                  <Tv2 className="h-6 w-6" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-white">{channel.name}</h2>
                  {channel.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <Star className="h-3 w-3" /> Verificado
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      channel.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {channel.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">/{channel.slug}</p>
              </div>
            </div>
            <Link
              href={`/canal/${channel.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff6b73] hover:text-white"
            >
              Ver página pública <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Lives" value={stats?.totalLives ?? 0} subtitle={`${stats?.liveNow ?? 0} ao vivo`} icon={Radio} />
        <StatCard title="Views" value={(stats?.totalViews ?? 0).toLocaleString("pt-PT")} icon={Eye} color="#22C55E" />
        <StatCard title="Subscritores" value={(stats?.subscribers ?? 0).toLocaleString("pt-PT")} icon={Users} color="#38BDF8" />
        <StatCard title="Gostos" value={(stats?.totalLikes ?? 0).toLocaleString("pt-PT")} icon={Heart} color="#F472B6" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/creator/lives",
            icon: Zap,
            title: "Gerir lives",
            desc: "Lista e estado das tuas transmissões",
          },
          {
            href: "/creator/analytics",
            icon: BarChart3,
            title: "Analíticas",
            desc: "Views, gostos e crescimento",
          },
          {
            href: "/creator/channel",
            icon: Tv2,
            title: "Perfil do canal",
            desc: "Nome, redes e identidade visual",
          },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-4 transition-all hover:border-[#E50914]/30 hover:bg-[#111118]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#E50914]/20 bg-[#E50914]/10 text-[#ff6b73] transition group-hover:scale-105">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 group-hover:text-[#ff6b73]">
              Abrir <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
