"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Eye, Heart, MessageCircle, Send, Share2, Users,
  Radio, Settings, Maximize2, Volume2, VolumeX, SkipForward,
  Wifi, WifiOff, AlertCircle, CheckCircle, Info, X, Trophy, Signal, Server,
} from "lucide-react";
import type { Live, LiveComment, LiveEngagement, Ad } from "@/types";
import { cn, formatNumber } from "@/utils";
import { resolveCountryFlagUrl } from "@/lib/flags";
import LivePlayer from "@/components/watch/LivePlayer";
import { apiRequest, publicApiRequest } from "@/lib/api";
import { useViewerCount } from "@/hooks/useViewerCount";

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
    return user.name || "Visitante";
  } catch {
    return "Visitante";
  }
}

function timeAgo(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 45) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function isImageValue(v?: string) {
  return Boolean(v && (/^(https?:|data:|blob:)/.test(v) || v.startsWith("/")));
}

function isAdActive(ad: Ad) {
  if (ad.status !== "active") return false;
  const now = Date.now();
  if (ad.startDate && new Date(ad.startDate).getTime() > now) return false;
  if (ad.endDate && new Date(ad.endDate).getTime() < now) return false;
  return true;
}

function pickActiveAd(ads: Ad[], position: Ad["position"]) {
  return ads.find((ad) => ad.position === position && isAdActive(ad));
}

function TeamCrestSmall({ logo, name, code }: { logo?: string; name?: string; code?: string }) {
  const flagUrl = resolveCountryFlagUrl({ code, name, logo, size: 24 });
  const src = flagUrl || (isImageValue(logo) ? logo : null);
  if (src)
    return <img src={src} alt="" className="h-6 w-6 rounded-full border border-white/15 object-cover bg-black/30 p-0.5" />;
  return (
    <div className="h-6 w-6 flex items-center justify-center rounded-full bg-[#1A1A28] border border-white/10 text-[10px] font-black text-white">
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Pre-roll Ad Overlay ──────────────────────────────────────────────────────
function PrerollAd({ ad, onComplete }: { ad: Ad; onComplete: () => void }) {
  const duration = ad.format === "video" ? 15 : 8;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const SKIP_AFTER = 5;

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); onComplete(); return 0; }
        if (prev === duration - SKIP_AFTER) setCanSkip(true);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 z-30 bg-black flex flex-col">
      {/* Ad content */}
      <div className="flex-1 relative overflow-hidden">
        {ad.format === "video" && ad.videoUrl ? (
          <video
            src={ad.videoUrl}
            className="w-full h-full object-contain"
            autoPlay muted playsInline
            onEnded={onComplete}
          />
        ) : ad.imageUrl ? (
          <a href={ad.clickUrl || "#"} target="_blank" rel="noreferrer" className="block w-full h-full">
            <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-contain" />
          </a>
        ) : null}

        {/* Ad label */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-black/60 text-yellow-400 rounded border border-yellow-400/30">
            Publicidade · Ad
          </span>
        </div>

        {/* Visit advertiser */}
        {ad.clickUrl && (
          <a
            href={ad.clickUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute top-3 right-3 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 backdrop-blur-sm transition-all"
          >
            Visitar →
          </a>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3 bg-black/90 px-4 py-2 border-t border-white/8">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs text-gray-500">Anúncio</span>
          {timeLeft > 0 && (
            <span className="text-xs text-gray-400">{timeLeft}s</span>
          )}
        </div>
        {canSkip ? (
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black text-xs font-black hover:bg-gray-200 transition-all"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Pular anúncio
          </button>
        ) : (
          <span className="text-xs text-gray-500">
            Pular em {Math.max(0, SKIP_AFTER - (duration - timeLeft))}s...
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Connection Status Banner ─────────────────────────────────────────────────
function ConnectionBanner({ status }: { status: "reconnecting" | "offline" | "ok" }) {
  if (status === "ok") return null;
  return (
    <div className={cn(
      "absolute top-12 inset-x-0 z-20 flex items-center justify-center gap-2 py-2 text-xs font-bold",
      status === "reconnecting" ? "bg-yellow-500/90" : "bg-red-600/90"
    )}>
      {status === "reconnecting" ? (
        <><Wifi className="h-3.5 w-3.5 animate-pulse" /> Reconectando...</>
      ) : (
        <><WifiOff className="h-3.5 w-3.5" /> Sem conexão</>
      )}
    </div>
  );
}

// ─── Server Selector ──────────────────────────────────────────────────────────
function ServerSelector({
  servers,
  currentIdx,
  onSelect,
  onClose,
}: {
  servers: Live["streamServers"];
  currentIdx: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-14 right-3 z-20 w-56 rounded-xl border border-[#1E1E2A] bg-[#111118]/95 backdrop-blur-md shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1E1E2A]">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5 text-[#E50914]" /> Servidores
        </span>
        <button onClick={onClose}><X className="h-3.5 w-3.5 text-gray-500 hover:text-white" /></button>
      </div>
      <div className="p-1">
        {(servers || []).map((srv, i) => (
          <button
            key={srv.id}
            onClick={() => { onSelect(i); onClose(); }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all",
              i === currentIdx
                ? "bg-[#E50914]/15 border border-[#E50914]/30 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Signal className={cn("h-3.5 w-3.5", i === currentIdx ? "text-[#E50914]" : "text-gray-600")} />
            <span className="flex-1 text-left font-semibold">{srv.name}</span>
            {srv.quality && <span className="text-gray-600 text-[10px] font-medium bg-white/5 px-1.5 py-0.5 rounded">{srv.quality}</span>}
            {i === currentIdx && <CheckCircle className="h-3 w-3 text-[#E50914]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Mid-roll / Post-roll Ad Overlay ─────────────────────────────────────────
function MidrollAd({ ad, onComplete, label = "Intervalo" }: { ad: Ad; onComplete: () => void; label?: string }) {
  const duration = ad.format === "video" ? 20 : 10;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const SKIP_AFTER = 8;

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) { clearInterval(t); onComplete(); return 0; }
        if (prev === duration - SKIP_AFTER) setCanSkip(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 z-30 bg-black/95 flex flex-col animate-fadeInUp">
      <div className="flex-1 relative overflow-hidden">
        {ad.format === "video" && ad.videoUrl ? (
          <video src={ad.videoUrl} className="w-full h-full object-contain" autoPlay muted playsInline onEnded={onComplete} />
        ) : ad.imageUrl ? (
          <a href={ad.clickUrl || "#"} target="_blank" rel="noreferrer" className="block w-full h-full">
            <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-contain" />
          </a>
        ) : null}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-black/70 text-yellow-400 rounded border border-yellow-400/30">
            {label} · Publicidade
          </span>
        </div>
        {ad.clickUrl && (
          <a href={ad.clickUrl} target="_blank" rel="noreferrer"
            className="absolute top-3 right-3 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all">
            Visitar →
          </a>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 bg-black/90 px-4 py-2 border-t border-white/8">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs text-gray-500">Anuncio · {timeLeft}s</span>
        </div>
        {canSkip ? (
          <button onClick={onComplete} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black text-xs font-black hover:bg-gray-200 transition-all">
            <SkipForward className="h-3.5 w-3.5" /> Continuar
          </button>
        ) : (
          <span className="text-xs text-gray-500">Continuar em {Math.max(0, SKIP_AFTER - (duration - timeLeft))}s...</span>
        )}
      </div>
    </div>
  );
}


const CHAT_COLORS = [
  "text-sky-400", "text-emerald-400", "text-violet-400",
  "text-amber-400", "text-pink-400", "text-teal-400",
];

function chatColor(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return CHAT_COLORS[n % CHAT_COLORS.length];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WatchExperience({ live, liveId }: WatchExperienceProps) {
  const id = liveId || live.id;

  const [activeLive, setActiveLive] = useState(live);
  const [liked, setLiked] = useState(false);
  const [viewers, setViewers] = useState(live.viewerCount);
  const { count: socketViewers, connected: socketConnected } = useViewerCount(id, viewers);
  const displayViewers = socketConnected ? socketViewers : viewers;
  const [totalViews, setTotalViews] = useState(live.totalViews);
  const [likeCount, setLikeCount] = useState(live.likeCount || 0);
  const [shareCount, setShareCount] = useState(live.shareCount || 0);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<LiveComment[]>([]);
  const [clientId, setClientId] = useState("");
  const [serverIdx, setServerIdx] = useState(0);
  const [showServers, setShowServers] = useState(false);
  const [prerollAd, setPrerollAd] = useState<Ad | null>(null);
  const [midrollAd, setMidrollAd] = useState<Ad | null>(null);
  const [adDone, setAdDone] = useState(false);
  const [adsChecked, setAdsChecked] = useState(false);
  const [midrollDone, setMidrollDone] = useState(false);
  // Recurring mid-roll: interval ref for 30-min recurring ads
  const midrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connStatus, setConnStatus] = useState<"ok" | "reconnecting" | "offline">("ok");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Initial load
  useEffect(() => {
    const cid = getClientId();
    setClientId(cid);

    publicApiRequest<Live>(`/lives/${id}`)
      .then((l) => {
        setActiveLive(l);
        setViewers(l.viewerCount);
        setTotalViews(l.totalViews);
        setLikeCount(l.likeCount || 0);
        setShareCount(l.shareCount || 0);
      })
      .catch(() => setActiveLive(live));

    // Register view
    apiRequest<{ totalViews: number; viewerCount: number }>(`/lives/${id}/view`, {
      method: "POST",
      body: JSON.stringify({ clientId: cid }),
    })
      .then((s) => { setTotalViews(s.totalViews); setViewers(s.viewerCount); })
      .catch(() => undefined);

    // Engagement
    publicApiRequest<LiveEngagement>(`/lives/${id}/engagement?clientId=${encodeURIComponent(cid)}`)
      .then((s) => {
        setLiked(s.liked);
        setLikeCount(s.likeCount);
        setShareCount(s.shareCount);
        setTotalViews(s.totalViews);
        setViewers(s.viewerCount);
      })
      .catch(() => undefined);

    // Comments
    publicApiRequest<LiveComment[]>(`/lives/${id}/comments`)
      .then(setChat)
      .catch(() => setChat([]));

    // Pre-roll ad separated from display ads: live_preroll first, player as legacy fallback.
    void (async () => {
      try {
        const prerollAds = await publicApiRequest<Ad[]>("/ads?position=live_preroll");
        let ad = pickActiveAd(prerollAds, "live_preroll");

        if (!ad) {
          const legacyPlayerAds = await publicApiRequest<Ad[]>("/ads?position=player");
          ad = pickActiveAd(legacyPlayerAds, "player");
        }

        if (ad) setPrerollAd(ad);
        else setAdDone(true);
      } catch {
        setAdDone(true);
      } finally {
        setAdsChecked(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Polling: update viewer count + new comments every 30s
  useEffect(() => {
    const t = setInterval(() => {
      publicApiRequest<LiveEngagement>(`/lives/${id}/engagement?clientId=${encodeURIComponent(clientId)}`)
        .then((s) => {
          setViewers(s.viewerCount);
          setLikeCount(s.likeCount);
        })
        .catch(() => undefined);

      publicApiRequest<LiveComment[]>(`/lives/${id}/comments?limit=20`)
        .then((msgs) => setChat(msgs))
        .catch(() => undefined);
    }, 30000);
    return () => clearInterval(t);
  }, [id, clientId]);

  // Mid-roll ads: show every 30 minutes while live is playing
  // First ad triggers after 30 min, then repeats every 30 min
  useEffect(() => {
    if (!adDone) return;

    const fetchAndShowMidroll = () => {
      publicApiRequest<Ad[]>("/ads?position=player")
        .then((ads) => {
          const midAd = ads.find(
            (a) => a.position === "player" && isAdActive(a)
          );
          if (midAd) {
            setMidrollDone(false);
            setMidrollAd(midAd);
          }
        })
        .catch(() => undefined);
    };

    // Clear any existing interval
    if (midrollIntervalRef.current) clearInterval(midrollIntervalRef.current);

    // First midroll after 30 minutes, then every 30 minutes
    const MIDROLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
    const firstTimer = setTimeout(() => {
      fetchAndShowMidroll();
      // After first, set repeating interval
      midrollIntervalRef.current = setInterval(fetchAndShowMidroll, MIDROLL_INTERVAL_MS);
    }, MIDROLL_INTERVAL_MS);

    return () => {
      clearTimeout(firstTimer);
      if (midrollIntervalRef.current) clearInterval(midrollIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adDone]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    try {
      const created = await apiRequest<LiveComment>(`/lives/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ clientId, userName: getUserName(), message: text }),
      });
      setChat((c) => [...c, created]);
    } catch { /* ignore */ }
  };

  const toggleLike = async () => {
    try {
      const s = await apiRequest<{ liked: boolean; likeCount: number }>(`/lives/${id}/like`, {
        method: "POST",
        body: JSON.stringify({ clientId }),
      });
      setLiked(s.liked);
      setLikeCount(s.likeCount);
    } catch {
      setLiked((c) => !c);
    }
  };

  const shareLive = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: activeLive.title, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* ignore */ }
    try {
      const s = await apiRequest<{ shareCount: number }>(`/lives/${id}/share`, {
        method: "POST",
        body: JSON.stringify({ clientId, target: typeof navigator.share === "function" ? "native" : "copy" }),
      });
      setShareCount(s.shareCount);
    } catch {
      setShareCount((c) => c + 1);
    }
  };

  const currentServer = activeLive.streamServers?.[serverIdx];
  const liveToPlay: Live = {
    ...activeLive,
    viewerCount: viewers,
    ...(currentServer ? { hlsUrl: currentServer.url, streamUrl: currentServer.url } : {}),
  };

  const showPreroll = adsChecked && !adDone && !!prerollAd;
  const showMidroll = !!midrollAd && !midrollDone;
  const adOverlay = !adsChecked
    ? "checking"
    : showPreroll
      ? "preroll"
      : showMidroll
        ? "midroll"
        : null;

  return (
    <div className="h-screen overflow-hidden bg-[#060609] text-white flex flex-col">
      {/* Top bar */}
      <header className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-[#1E1E2A] bg-[#0A0A10] px-3 z-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white flex-shrink-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>

        <div className="h-4 w-px bg-[#1E1E2A]" />

        {/* Status badge */}
        {activeLive.status === "live" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E50914] to-[#B00000] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider flex-shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-white live-badge" />
            AO VIVO
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A28] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 flex-shrink-0">
            {activeLive.status === "scheduled" ? "AGENDADO" : "ENCERRADO"}
          </span>
        )}

        {/* Score (if live) */}
        {activeLive.status === "live" && (activeLive.teamA || activeLive.teamB) && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E1E2A] bg-[#111118]">
            <TeamCrestSmall logo={activeLive.teamALogo} name={activeLive.teamA} />
            <span className="text-xs font-semibold text-white">{activeLive.teamA}</span>
            <span className="score-display text-base font-black text-white px-2">
              {activeLive.scoreA ?? 0} – {activeLive.scoreB ?? 0}
            </span>
            <span className="text-xs font-semibold text-white">{activeLive.teamB}</span>
            <TeamCrestSmall logo={activeLive.teamBLogo} name={activeLive.teamB} />
            <span className="text-[10px] font-black text-[#E50914] ml-1">{activeLive.matchTime}</span>
          </div>
        )}

        {/* Title */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-white leading-tight">{activeLive.title}</h1>
          <p className="hidden truncate text-[10px] text-gray-500 sm:block">{activeLive.league}</p>
        </div>

        {/* Viewers — real-time via Socket.IO */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111118] border border-[#1E1E2A] text-sm font-semibold text-gray-300 flex-shrink-0">
          <Users className="h-3.5 w-3.5 text-[#E50914]" />
          {formatNumber(displayViewers)}
          {socketConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" title="Contagem ao vivo" />
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 min-h-0">
        {/* Player + controls */}
        <section className="flex flex-col flex-1 min-w-0 min-h-0 relative">
          {/* Player area */}
          <div className="flex-1 min-h-0 relative bg-black">
            <LivePlayer live={liveToPlay} adOverlay={adOverlay} />
            {showPreroll && (
              <PrerollAd
                ad={prerollAd!}
                onComplete={() => {
                  setAdDone(true);
                  setPrerollAd(null);
                }}
              />
            )}
            {showMidroll && (
              <MidrollAd
                ad={midrollAd!}
                onComplete={() => {
                  // Clear current ad but keep interval running for next 30-min cycle
                  setMidrollAd(null);
                  setMidrollDone(true);
                }}
                label="Intervalo publicitário"
              />
            )}
            <ConnectionBanner status={connStatus} />

            {/* Server selector overlay */}
            {showServers && (activeLive.streamServers?.length ?? 0) > 0 && (
              <ServerSelector
                servers={activeLive.streamServers}
                currentIdx={serverIdx}
                onSelect={setServerIdx}
                onClose={() => setShowServers(false)}
              />
            )}
          </div>

          {/* Controls bar */}
          <div className="flex flex-shrink-0 items-center gap-2 border-t border-[#1E1E2A] bg-[#0A0A10] px-3 py-2">
            {/* Like */}
            <button
              onClick={toggleLike}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-all",
                liked
                  ? "bg-[#E50914]/15 border border-[#E50914]/30 text-[#E50914]"
                  : "bg-[#111118] border border-[#1E1E2A] text-gray-400 hover:text-white hover:border-[#E50914]/30"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
              <span className="text-xs">{formatNumber(likeCount)}</span>
            </button>

            {/* Share */}
            <button
              onClick={shareLive}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#111118] border border-[#1E1E2A] px-3 text-sm font-semibold text-gray-400 transition-all hover:text-white hover:border-[#E50914]/30"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="text-xs">{formatNumber(shareCount)}</span>
            </button>

            {/* Views */}
            <div className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#111118] border border-[#1E1E2A] px-3 text-sm font-semibold text-gray-400">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs">{formatNumber(totalViews)}</span>
            </div>

            {/* Server selector */}
            {(activeLive.streamServers?.length ?? 0) > 0 && (
              <button
                onClick={() => setShowServers(!showServers)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-all",
                  showServers
                    ? "bg-[#E50914]/15 border border-[#E50914]/30 text-[#E50914]"
                    : "bg-[#111118] border border-[#1E1E2A] text-gray-400 hover:text-white"
                )}
              >
                <Radio className="h-3.5 w-3.5" />
                <span className="text-xs hidden sm:inline">
                  {currentServer?.name || "Servidor"} {currentServer?.quality ? `· ${currentServer.quality}` : ""}
                </span>
              </button>
            )}

            {/* League */}
            {activeLive.league && (
              <div className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#111118] border border-[#1E1E2A]">
                {isImageValue(activeLive.leagueLogo) ? (
                  <img src={activeLive.leagueLogo} alt="" className="h-4 w-4 object-contain" />
                ) : (
                  <Trophy className="h-3.5 w-3.5 text-gray-600" />
                )}
                <span className="text-xs font-medium text-gray-400">{activeLive.league}</span>
              </div>
            )}

            <div className="flex-1" />

            {/* Viewer count — real-time via Socket.IO */}
            <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#E50914]/10 border border-[#E50914]/20">
              <Users className="h-3.5 w-3.5 text-[#E50914]" />
              <span className="text-xs font-bold text-[#E50914]">{formatNumber(displayViewers)}</span>
              {socketConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" title="Ao vivo" />
              )}
            </div>
          </div>
        </section>

        {/* Chat sidebar */}
        <aside className="hidden lg:flex flex-col w-[300px] flex-shrink-0 min-h-0 border-l border-[#1E1E2A] bg-[#0A0A10]">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-[#1E1E2A] px-4 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#E50914]" />
              <h2 className="text-sm font-bold text-white">Chat ao Vivo</h2>
            </div>
            <span className="text-[10px] font-medium text-gray-600 bg-[#111118] px-2 py-0.5 rounded-full border border-[#1E1E2A]">
              {chat.length}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
            {chat.length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <MessageCircle className="h-6 w-6 text-gray-700 mb-2" />
                <p className="text-xs text-gray-600">Nenhuma mensagem ainda</p>
                <p className="text-[10px] text-gray-700">Seja o primeiro a comentar!</p>
              </div>
            )}
            {chat.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <div className={cn(
                  "flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black",
                  msg.admin
                    ? "bg-gradient-to-br from-[#E50914] to-[#B00000] text-white"
                    : "bg-[#1A1A28] border border-[#1E1E2A] text-white"
                )}>
                  {msg.userName[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn(
                      "text-[11px] font-bold",
                      msg.admin ? "text-[#E50914]" : chatColor(msg.userName)
                    )}>
                      {msg.userName}
                    </span>
                    {msg.admin && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-[#E50914]/15 text-[#E50914] px-1.5 py-0.5 rounded">ADMIN</span>
                    )}
                    <span className="text-[10px] text-gray-700 ml-auto">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 break-words text-xs leading-relaxed text-gray-300">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Message input */}
          <div className="flex-shrink-0 border-t border-[#1E1E2A] p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Comentar..."
                maxLength={500}
                className="flex-1 min-w-0 rounded-xl border border-[#1E1E2A] bg-[#111118] px-3 py-2 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-[#E50914]/50 focus:ring-1 focus:ring-[#E50914]/20"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="flex-shrink-0 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] p-2 text-white transition-all hover:from-[#FF1A24] hover:to-[#E50914] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-700 mt-1.5 text-right">
              {message.length}/500
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}


