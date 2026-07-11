"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Eye, Users, TrendingUp, Plus, ArrowUpRight, Tv2, BarChart3, Star, Zap, AlertCircle } from "lucide-react";
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

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#1E1E2A] ${className}`} />;
}

function StatCard({ title, value, subtitle, icon: Icon, color = "#E50914" }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType; color?: string;
}) {
  return (
    <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5 hover:border-[#E50914]/20 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
          {subtitle && <p className="text-[10px] text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
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
          apiRequest<CreatorStats>("/creator/stats"),
          apiRequest<Channel | null>("/creator/me"),
        ]);
        setStats(statsData);
        setChannel(channelData);
        if (!channelData) setNoChannel(true);
      } catch {
        setNoChannel(true);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Creator Studio</h1>
          <p className="text-xs text-gray-500 mt-0.5">Gere o teu conteúdo e analisa as tuas métricas</p>
        </div>
        <Link href="/admin/lives/new" className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] transition-colors">
          <Plus className="h-4 w-4" /> Nova Live
        </Link>
      </div>

      {noChannel && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-300">Canal não configurado</p>
            <p className="text-sm text-yellow-200/70 mt-1">Cria o teu canal para começar a transmitir e monetizar o teu conteúdo.</p>
            <Link href="/creator/channel" className="inline-flex items-center gap-1.5 mt-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 px-3 py-1.5 text-xs font-bold text-yellow-300 hover:bg-yellow-500/30 transition-colors">
              <Tv2 className="h-3.5 w-3.5" /> Criar Canal
            </Link>
          </div>
        </div>
      )}

      {channel && (
        <div className="rounded-xl border border-[#E50914]/20 bg-gradient-to-r from-[#E50914]/5 to-transparent p-5">
          <div className="flex items-center gap-4">
            {channel.avatar ? (
              <img src={channel.avatar} alt={channel.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#E50914]/30" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-xl font-black text-white flex-shrink-0">
                {channel.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white truncate">{channel.name}</h2>
                {channel.verified && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  channel.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
                }`}>{channel.status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{channel.description || 'Sem descrição'}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-400"><span className="font-bold text-white">{channel.subscriberCount}</span> subscritores</span>
                <span className="text-xs text-gray-400"><span className="font-bold text-white">{channel.liveCount}</span> lives</span>
                <span className="text-xs text-gray-400"><span className="font-bold text-white">{channel.totalViews}</span> views</span>
              </div>
            </div>
            <Link href="/creator/channel" className="flex items-center gap-1.5 text-xs text-[#E50914] hover:underline flex-shrink-0">
              Editar <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Lives Totais" value={stats?.totalLives || 0} subtitle={`${stats?.liveNow || 0} ao vivo agora`} icon={Radio} />
        <StatCard title="Visualizações" value={(stats?.totalViews || 0).toLocaleString()} subtitle="últimos 30 dias" icon={Eye} color="#22C55E" />
        <StatCard title="Subscritores" value={(stats?.subscribers || 0).toLocaleString()} icon={Users} color="#E50914" />
        <StatCard title="Espectadores" value={(stats?.currentViewers || 0).toLocaleString()} subtitle="ao vivo agora" icon={Zap} color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { href: "/creator/lives", label: "Gerir Lives", desc: "Criar e gerir transmissões", icon: Radio, color: "text-[#E50914]" },
          { href: "/creator/analytics", label: "Analíticas", desc: "Ver métricas detalhadas", icon: BarChart3, color: "text-red-400" },
          { href: "/creator/channel", label: "Canal", desc: "Configurar o meu canal", icon: Tv2, color: "text-yellow-400" },
        ].map(({ href, label, desc, icon: Icon, color }) => (
          <Link key={href} href={href} className="group flex items-center gap-4 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 hover:border-[#E50914]/20 transition-all">
            <Icon className={`h-6 w-6 ${color} flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-600 group-hover:text-[#E50914] transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" /> Dicas para Crescer
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { tip: "Transmite regularmente", desc: "Consistência é chave para ganhar subscritores" },
            { tip: "Usa títulos apelativos", desc: "Inclui os nomes das equipas e ligas" },
            { tip: "Interaje com o chat", desc: "Responde às perguntas dos espectadores" },
            { tip: "Cria sondagens", desc: "Mantém o público envolvido com votações" },
          ].map(({ tip, desc }) => (
            <div key={tip} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E50914] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">{tip}</p>
                <p className="text-[11px] text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
