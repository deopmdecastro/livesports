"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Heart, MessageCircle, Send, Share2, Users } from "lucide-react";
import type { Live, LiveComment, LiveEngagement } from "@/types";
import { cn, formatNumber } from "@/utils";
import LivePlayer from "@/components/watch/LivePlayer";
import { apiRequest, publicApiRequest } from "@/lib/api";

interface WatchExperienceProps {
  live: Live;
  liveId?: string;
}

function getClientId() {
  const key = "livesports.clientId";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

function getUserName() {
  try {
    const user = JSON.parse(window.localStorage.getItem("livesports.user") || "{}") as { name?: string };
    return user.name || "Voce";
  } catch {
    return "Voce";
  }
}

function timeAgo(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function WatchExperience({ live, liveId }: WatchExperienceProps) {
  const [activeLive, setActiveLive] = useState(live);
  const [liked, setLiked] = useState(false);
  const [viewers, setViewers] = useState(live.viewerCount);
  const [totalViews, setTotalViews] = useState(live.totalViews);
  const [likeCount, setLikeCount] = useState(live.likeCount || 0);
  const [shareCount, setShareCount] = useState(live.shareCount || 0);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<LiveComment[]>([]);
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    const nextClientId = getClientId();
    setClientId(nextClientId);

    publicApiRequest<Live>(`/lives/${liveId || live.id}`)
      .then((freshLive) => {
        setActiveLive(freshLive);
        setViewers(freshLive.viewerCount);
        setTotalViews(freshLive.totalViews);
        setLikeCount(freshLive.likeCount || 0);
        setShareCount(freshLive.shareCount || 0);
      })
      .catch(() => setActiveLive(live));

    apiRequest<{ totalViews: number; viewerCount: number }>(`/lives/${liveId || live.id}/view`, {
      method: "POST",
      body: JSON.stringify({ clientId: nextClientId }),
    })
      .then((stats) => {
        setTotalViews(stats.totalViews);
        setViewers(stats.viewerCount);
      })
      .catch(() => undefined);

    publicApiRequest<LiveEngagement>(`/lives/${liveId || live.id}/engagement?clientId=${encodeURIComponent(nextClientId)}`)
      .then((stats) => {
        setLiked(stats.liked);
        setLikeCount(stats.likeCount);
        setShareCount(stats.shareCount);
        setTotalViews(stats.totalViews);
        setViewers(stats.viewerCount);
      })
      .catch(() => undefined);

    publicApiRequest<LiveComment[]>(`/lives/${liveId || live.id}/comments`)
      .then(setChat)
      .catch(() => setChat([]));
  }, [live, liveId]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text) return;

    try {
      const created = await apiRequest<LiveComment>(`/lives/${liveId || live.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ clientId, userName: getUserName(), message: text }),
      });
      setChat((current) => [...current, created]);
      setMessage("");
    } catch {
      setMessage("");
    }
  };

  const toggleLike = async () => {
    try {
      const stats = await apiRequest<{ liked: boolean; likeCount: number }>(`/lives/${liveId || live.id}/like`, {
        method: "POST",
        body: JSON.stringify({ clientId }),
      });
      setLiked(stats.liked);
      setLikeCount(stats.likeCount);
    } catch {
      setLiked((current) => !current);
    }
  };

  const shareLive = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: activeLive.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      return;
    }

    const usedNativeShare = typeof navigator.share === "function";

    try {
      const stats = await apiRequest<{ shareCount: number }>(`/lives/${liveId || live.id}/share`, {
        method: "POST",
        body: JSON.stringify({ clientId, target: usedNativeShare ? "native" : "copy" }),
      });
      setShareCount(stats.shareCount);
    } catch {
      setShareCount((current) => current + 1);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0A0A0A] text-white">
      <header className="flex h-12 items-center gap-3 border-b border-[#1A1A1A] bg-[#0F0F0F] px-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <span className="inline-flex items-center gap-1 rounded bg-[#E50914] px-2 py-1 text-xs font-black">
          <span className="h-1.5 w-1.5 rounded-full bg-white live-badge" />
          AO VIVO
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-white">{activeLive.title}</h1>
          <p className="hidden truncate text-xs text-gray-500 sm:block">{activeLive.league}</p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-300">
          <Users className="h-4 w-4" />
          {formatNumber(viewers)}
        </div>
      </header>

      <main className="grid h-[calc(100vh-48px)] min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_48px] bg-black">
          <LivePlayer live={{ ...activeLive, viewerCount: viewers }} />

          <div className="flex min-h-0 items-center gap-2 border-t border-[#1A1A1A] bg-[#0F0F0F] px-3">
            <button
              onClick={toggleLike}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors",
                liked ? "bg-red-500/20 text-red-300" : "bg-[#1A1A1A] text-gray-400 hover:text-white"
              )}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              {formatNumber(likeCount)}
            </button>
            <button onClick={shareLive} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 text-sm font-semibold text-gray-400 transition-colors hover:text-white">
              <Share2 className="h-4 w-4" />
              {formatNumber(shareCount)}
            </button>
            <div className="hidden h-8 items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 text-sm font-semibold text-gray-400 sm:inline-flex">
              <MessageCircle className="h-4 w-4" />
              {formatNumber(chat.length)}
            </div>
            <div className="hidden h-8 items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 text-sm font-semibold text-gray-400 md:inline-flex">
              <Eye className="h-4 w-4" />
              {formatNumber(totalViews)}
            </div>
            <div className="ml-auto hidden items-center gap-2 rounded-lg bg-[#1A1A1A] px-3 py-1.5 sm:flex">
              <Users className="h-3.5 w-3.5 text-[#E50914]" />
              <span className="text-sm font-bold text-white">{formatNumber(viewers)}</span>
              <span className="text-xs text-gray-400">espectadores</span>
            </div>
          </div>
        </section>

        <aside className="hidden min-h-0 border-l border-[#1A1A1A] bg-[#0F0F0F] lg:grid lg:grid-rows-[44px_minmax(0,1fr)_58px]">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] px-3">
            <h2 className="text-sm font-bold text-white">Chat ao Vivo</h2>
            <span className="text-xs text-gray-500">{chat.length} mensagens</span>
          </div>

          <div className="min-h-0 overflow-y-auto p-3">
            <div className="space-y-3">
              {chat.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black",
                      msg.admin ? "bg-[#E50914]" : "bg-[#2A2A2A]"
                    )}
                  >
                    {msg.userName[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold", msg.admin ? "text-[#E50914]" : "text-gray-300")}>
                        {msg.userName}
                      </span>
                      <span className="text-[10px] text-gray-600">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 break-words text-xs leading-relaxed text-gray-200">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 border-t border-[#1A1A1A] p-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
              placeholder="Digite uma mensagem..."
              className="min-w-0 flex-1 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-xs text-white outline-none transition-colors focus:border-[#E50914]"
            />
            <button onClick={sendMessage} className="rounded-lg bg-[#E50914] p-2 text-white transition-colors hover:bg-[#B00000]">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
