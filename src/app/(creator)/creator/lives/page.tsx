"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Plus,
  Eye,
  Users,
  Play,
  Clock,
  CheckCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";
import { cn } from "@/utils";

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  live: {
    label: "Ao vivo",
    className: "bg-[#E50914]/15 text-[#ff6b73] border-[#E50914]/25",
    icon: Radio,
  },
  scheduled: {
    label: "Agendado",
    className: "bg-sky-500/15 text-sky-300 border-sky-500/20",
    icon: Clock,
  },
  ended: {
    label: "Terminado",
    className: "bg-white/5 text-gray-400 border-white/10",
    icon: CheckCircle,
  },
};

export default function CreatorLivesPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ApiListResponse<Live>>("/lives?limit=50");
      setLives(data.items || []);
    } catch {
      toast.error("Erro ao carregar lives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(
    () => ({
      all: lives.length,
      live: lives.filter((l) => l.status === "live").length,
      scheduled: lives.filter((l) => l.status === "scheduled").length,
      ended: lives.filter((l) => l.status === "ended").length,
    }),
    [lives]
  );

  const filtered = filter === "all" ? lives : lives.filter((l) => l.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">As Minhas Lives</h1>
          <p className="mt-1 text-sm text-gray-500">
            {counts.all} transmissão{counts.all === 1 ? "" : "ões"} · {counts.live} ao vivo
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </button>
          <Link
            href="/admin/lives"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-3.5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_rgba(229,9,20,0.22)] transition hover:bg-[#C50010]"
          >
            <Plus className="h-4 w-4" />
            Nova live
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(
          [
            { key: "all", label: "Todas", count: counts.all },
            { key: "live", label: "Ao vivo", count: counts.live },
            { key: "scheduled", label: "Agendadas", count: counts.scheduled },
            { key: "ended", label: "Terminadas", count: counts.ended },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
              filter === tab.key
                ? "border-[#E50914]/40 bg-[#E50914]/15 text-[#ff6b73]"
                : "border-white/10 bg-white/[0.02] text-gray-400 hover:text-white"
            )}
          >
            {tab.label}
            <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] tabular-nums">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-[#1E1E2A]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0E0E16]/50 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-gray-500">
            <Radio className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-white">Nenhuma live neste filtro</p>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            Quando publicares transmissões, elas aparecem aqui com estado, views e atalho para o player.
          </p>
          <Link
            href="/admin/lives"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Criar live
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((live) => {
            const meta = STATUS_META[live.status] || STATUS_META.ended;
            const StatusIcon = meta.icon;
            const views = Number((live as Live & { totalViews?: number }).totalViews || 0);
            return (
              <article
                key={live.id}
                className="group overflow-hidden rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] transition-all hover:border-[#E50914]/30"
              >
                <div className="relative aspect-video bg-[#111118]">
                  {live.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={live.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-700">
                      <Radio className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {live.status === "live" ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-[#E50914] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      Ao vivo
                    </span>
                  ) : null}
                  <Link
                    href={`/watch/${live.id}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <span className="rounded-full bg-[#E50914] p-3 shadow-lg shadow-[#E50914]/30">
                      <Play className="h-5 w-5 fill-white text-white" />
                    </span>
                  </Link>
                </div>
                <div className="p-3.5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{live.title}</p>
                      {live.teamA && live.teamB ? (
                        <p className="mt-0.5 truncate text-[11px] text-gray-500">
                          {live.teamA} vs {live.teamB}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                        meta.className
                      )}
                    >
                      <StatusIcon className="h-2.5 w-2.5" />
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {views}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {live.viewerCount || 0}
                      </span>
                    </div>
                    <Link
                      href={`/watch/${live.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-gray-400 transition-colors hover:text-white"
                    >
                      Abrir <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
