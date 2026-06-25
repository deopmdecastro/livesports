"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Eye, Heart, Clock, Play, TrendingUp, Star, Zap, Users, HeadphonesIcon } from "lucide-react";
import { formatNumber } from "@/utils";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";

function LiveCard({ live }: { live: Live }) {
  return (
    <Link href={`/watch/${live.id}`} className="group block rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden hover:border-[#E50914]/30 transition-all">
      <div className="relative aspect-video overflow-hidden">
        {live.thumbnail ? (
          <img src={live.thumbnail} alt={live.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-[#1A1A28] flex items-center justify-center">
            <Radio className="w-8 h-8 text-gray-700" />
          </div>
        )}
        {live.status === "live" && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#E50914] text-white text-[10px] font-black px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            AO VIVO
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#E50914] flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-white truncate">{live.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{live.league || live.sport}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(live.viewerCount)}</span>
          {live.teamA && live.teamB && (
            <span className="text-gray-500">{live.teamA} vs {live.teamB}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function UserDashboard() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=12")
      .then((r) => setLives(r.items || []))
      .catch(() => setLives([]))
      .finally(() => setLoading(false));
  }, []);

  const liveLives = lives.filter((l) => l.status === "live");
  const upcoming = lives.filter((l) => l.status === "scheduled").slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Olá! 👋</h1>
          <p className="text-sm text-gray-400 mt-1">Bem-vindo de volta ao LiveSports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0E0E16] border border-[#1E1E2A]">
            <Zap className="w-4 h-4 text-[#E50914]" />
            <span className="text-sm font-bold text-white">{liveLives.length} Ao Vivo</span>
          </div>
        </div>
      </div>

      {liveLives.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E50914] opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E50914]" />
            </span>
            <h2 className="text-base font-black text-white uppercase tracking-wider">Ao Vivo Agora</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveLives.map((l) => <LiveCard key={l.id} live={l} />)}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Lives Vistas", value: "0", icon: Eye, color: "#E50914" },
          { label: "Favoritos", value: "0", icon: Heart, color: "#EC4899" },
          { label: "Horas Vistas", value: "0h", icon: Clock, color: "#3B82F6" },
          { label: "Tickets Abertos", value: "0", icon: HeadphonesIcon, color: "#F59E0B" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" /> Em Breve
          </h2>
          <div className="space-y-2">
            {upcoming.map((live) => (
              <div key={live.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{live.title}</p>
                  <p className="text-xs text-gray-500">{live.league || live.sport}</p>
                </div>
                {live.teamA && live.teamB && (
                  <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                    {live.teamA} <span className="text-gray-600">vs</span> {live.teamB}
                  </div>
                )}
                <div className="flex-shrink-0 text-xs text-blue-400 font-semibold">Em Breve</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-black text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Ver Ao Vivo", href: "/", icon: Play, color: "#E50914", bg: "#E50914" },
            { label: "Favoritos", href: "/user/favorites", icon: Heart, color: "#EC4899", bg: "#EC4899" },
            { label: "Histórico", href: "/user/history", icon: Clock, color: "#3B82F6", bg: "#3B82F6" },
            { label: "Suporte", href: "/user/support", icon: HeadphonesIcon, color: "#F59E0B", bg: "#F59E0B" },
          ].map(({ label, href, icon: Icon, color, bg }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] hover:border-white/10 transition-all text-center"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${bg}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-gray-400">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
