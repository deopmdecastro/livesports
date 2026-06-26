"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radio, Eye, TrendingUp, MessageCircle, Plus, ArrowUpRight,
  Play, Users, Heart, Share2, AlertCircle, CheckCircle, Clock,
  BarChart3, Star, Zap,
} from "lucide-react";
import { formatNumber } from "@/utils";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";

function StatCard({ label, value, icon: Icon, color, growth }: {
  label: string; value: string | number; icon: React.ElementType; color: string; growth?: number;
}) {
  return (
    <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5 hover:border-violet-500/20 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      {growth !== undefined && (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">+{growth}%</span>
          <span className="text-xs text-gray-600">este mês</span>
        </div>
      )}
    </div>
  );
}

function LiveCard({ live }: { live: Live }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#1E1E2A] bg-[#111118] hover:border-violet-500/20 transition-all">
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[#1A1A28]">
        {live.thumbnail ? (
          <img src={live.thumbnail} alt={live.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Radio className="w-5 h-5 text-gray-600" />
          </div>
        )}
        {live.status === "live" && (
          <div className="absolute bottom-0 inset-x-0 bg-[#E50914] text-white text-[8px] font-black text-center py-0.5">AO VIVO</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{live.title}</p>
        <p className="text-xs text-gray-500">{live.league || live.sport}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(live.viewerCount)}</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(live.likeCount || 0)}</span>
      </div>
      <Link href={`/admin/lives/${live.id}`} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
        <ArrowUpRight className="w-4 h-4 text-gray-500" />
      </Link>
    </div>
  );
}

export default function CreatorDashboard() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=20")
      .then((r) => setLives(r.items || []))
      .catch(() => setLives([]))
      .finally(() => setLoading(false));
  }, []);

  const liveLives = lives.filter((l) => l.status === "live");
  const totalViews = lives.reduce((s, l) => s + (l.totalViews || 0), 0);
  const totalLikes = lives.reduce((s, l) => s + (l.likeCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Dashboard do Criador</h1>
          <p className="text-xs text-gray-500 mt-0.5">Gere o teu conteúdo e audiência</p>
        </div>
        <Link
          href="/creator/lives/new"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Live
        </Link>
      </div>

      {liveLives.length > 0 && (
        <div className="rounded-xl border border-[#E50914]/30 bg-[#E50914]/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E50914] opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E50914]" />
              </span>
              <span className="text-sm font-black text-white">{liveLives.length} Live{liveLives.length > 1 ? "s" : ""} a Decorrer</span>
            </div>
          </div>
          <div className="space-y-2">
            {liveLives.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/30">
                <span className="text-sm text-white font-medium truncate">{l.title}</span>
                <div className="flex items-center gap-3 text-xs flex-shrink-0 ml-3">
                  <span className="flex items-center gap-1 text-gray-400"><Users className="w-3 h-3" />{formatNumber(l.viewerCount)}</span>
                  <Link href={`/watch/${l.id}`} className="text-[#E50914] font-bold hover:underline flex items-center gap-1">
                    <Play className="w-3 h-3" /> Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Lives" value={lives.length} icon={Radio} color="#7C3AED" growth={12} />
        <StatCard label="Visualizações" value={formatNumber(totalViews)} icon={Eye} color="#3B82F6" growth={8} />
        <StatCard label="Gostos" value={formatNumber(totalLikes)} icon={Heart} color="#E50914" growth={23} />
        <StatCard label="Ao Vivo Agora" value={liveLives.length} icon={Zap} color="#22C55E" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#1E1E2A]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-violet-400" /> Minhas Lives
            </h3>
            <Link href="/creator/lives" className="text-xs text-violet-400 hover:underline">Ver todas</Link>
          </div>
          <div className="p-3 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-[#1A1A28] animate-pulse" />
              ))
            ) : lives.length === 0 ? (
              <div className="py-10 text-center">
                <Radio className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Nenhuma live criada</p>
                <Link href="/creator/lives/new" className="mt-2 inline-block text-xs text-violet-400 hover:underline">Criar agora</Link>
              </div>
            ) : (
              lives.slice(0, 5).map((l) => <LiveCard key={l.id} live={l} />)
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#1E1E2A]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-violet-400" /> Dicas Rápidas
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { icon: CheckCircle, color: "text-emerald-400", title: "Agenda regularmente", desc: "Lives consistentes aumentam a audiência em 40%" },
              { icon: Star, color: "text-amber-400", title: "Interaja com o chat", desc: "A interação aumenta o tempo médio de visualização" },
              { icon: Share2, color: "text-blue-400", title: "Promove nas redes", desc: "Partilha o link antes de começares" },
              { icon: Clock, color: "text-violet-400", title: "Duração ideal", desc: "Lives de 60-90 min têm mais retenção" },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-[#111118]">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="text-xs font-bold text-white">{title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
