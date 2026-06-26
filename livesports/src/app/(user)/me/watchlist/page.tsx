"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Play, Radio, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";

interface WatchItem {
  id: string; liveId?: string; eventId?: string; watchedAt: string;
  watchDuration: number;
  live?: { id: string; title: string; status: string; thumbnail?: string; teamA?: string; teamB?: string; sport?: string; };
}

function DurationLabel({ seconds }: { seconds: number }) {
  if (seconds < 60) return <span>{seconds}s</span>;
  if (seconds < 3600) return <span>{Math.floor(seconds / 60)}m</span>;
  return <span>{Math.floor(seconds / 3600)}h {Math.floor((seconds % 3600) / 60)}m</span>;
}

export default function UserWatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ApiListResponse<WatchItem>>("/users/me/watchlist");
      setItems(data.items || []);
    } catch {
      // Silently show empty state — endpoint may not exist yet
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#E50914]" /> Histórico
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{items.length} transmissão(ões) assistida(s)</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A]">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
          <Heart className="h-12 w-12 opacity-20" />
          <p className="text-sm">Ainda não assististe a nenhuma transmissão</p>
          <Link href="/" className="text-[#E50914] text-sm hover:underline">Explorar lives</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden hover:border-[#E50914]/20 transition-all group">
              <div className="relative h-32 bg-[#1A1A1A]">
                {item.live?.thumbnail ? (
                  <img src={item.live.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Radio className="h-8 w-8 text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                {item.live?.status === "live" && (
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] font-black bg-[#E50914] text-white px-2 py-0.5 rounded-full uppercase">🔴 Live</span>
                  </div>
                )}
                {item.live && (
                  <Link href={`/watch/${item.live.id}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="rounded-full bg-[#E50914] p-3 shadow-lg">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  </Link>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-white truncate">{item.live?.title || "Transmissão"}</p>
                {item.live?.teamA && item.live?.teamB && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.live.teamA} vs {item.live.teamB}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-500">
                    {new Date(item.watchedAt).toLocaleDateString("pt-PT")}
                  </span>
                  {item.watchDuration > 0 && (
                    <span className="text-[10px] text-gray-600">
                      Assistiu <DurationLabel seconds={item.watchDuration} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
