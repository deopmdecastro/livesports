"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Radio,
  Server,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Live, LiveStreamServer } from "@/types";
import { cn, formatNumber } from "@/utils";

type AdOverlayMode = "checking" | "preroll" | "midroll" | null;

interface LivePlayerProps {
  live: Live;
  adOverlay?: AdOverlayMode;
  autoPlayMuted?: boolean;
}

const FALLBACK_STREAM_URL = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function LivePlayer({ live, adOverlay = null, autoPlayMuted = false }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(autoPlayMuted);
  const [volume, setVolume] = useState(0.85);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState("");
  const [streamReady, setStreamReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // Track whether user explicitly paused — prevents auto-play from overriding
  const userPausedRef = useRef(false);

  const servers = useMemo<Required<LiveStreamServer>[]>(() => {
    const customServers = (live.streamServers || [])
      .filter((s) => s.url?.trim())
      .map((s, i) => ({
        id: s.id || `server-${i}`,
        name: s.name || `Servidor ${i + 1}`,
        quality: s.quality || "Auto",
        latency: s.latency || "Normal",
        url: s.url,
      }));

    if (customServers.length > 0) return customServers;

    const primaryUrl = live.hlsUrl || live.m3u8Url || live.streamUrl || FALLBACK_STREAM_URL;
    return [
      { id: "auto", name: "Servidor Auto", quality: "Auto HD", latency: "Baixa", url: primaryUrl },
      { id: "backup", name: "Backup HLS", quality: "HD", latency: "Media", url: FALLBACK_STREAM_URL },
      { id: "mobile", name: "Mobile", quality: "Adaptavel", latency: "Estavel", url: primaryUrl },
    ];
  }, [live.hlsUrl, live.m3u8Url, live.streamServers, live.streamUrl]);

  const [serverId, setServerId] = useState(servers[0].id);
  const activeServer = servers.find((s) => s.id === serverId) || servers[0];
  const progress = duration > 0 && Number.isFinite(duration) ? (currentTime / duration) * 100 : 100;

  // ── Load / switch stream ─────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setBuffering(true);
    setError("");
    setStreamReady(false);
    setPlaying(false);
    userPausedRef.current = false; // reset pause state on server switch

    hlsRef.current?.destroy();
    hlsRef.current = null;
    video.pause();
    video.removeAttribute("src");
    video.load();

    const onLoadedMeta = () => {
      setStreamReady(true);
      setBuffering(false);
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari / iOS)
      video.src = activeServer.url;
      video.addEventListener("loadedmetadata", onLoadedMeta, { once: true });
    } else if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, backBufferLength: 60 });
      hlsRef.current = hls;
      hls.loadSource(activeServer.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamReady(true);
        setBuffering(false);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError("Nao foi possivel carregar este servidor. Tente outro.");
          setBuffering(false);
        }
      });
    } else {
      setError("Este navegador nao suporta transmissao HLS.");
      setBuffering(false);
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [activeServer.url]);

  // ── Auto-play when stream is ready (only if user hasn't explicitly paused) ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamReady) return;

    // Ad overlay handling
    if (adOverlay === "preroll" || adOverlay === "checking") {
      video.volume = volume;
      video.muted = true;
      void video.play().then(() => { setPlaying(true); setError(""); }).catch(() => undefined);
      return;
    }
    if (adOverlay === "midroll") {
      video.pause();
      setPlaying(false);
      return;
    }

    // Only auto-play if user hasn't explicitly paused
    if (!userPausedRef.current) {
      video.volume = volume;
      video.muted = muted || volume === 0;
      void video.play()
        .then(() => { setPlaying(true); setError(""); })
        .catch(() => {
          // Browser blocked autoplay — show play button, don't show error
          setPlaying(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamReady, adOverlay]);

  // ── Sync volume/mute changes to video element (without triggering play) ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted || volume === 0;
  }, [muted, volume]);

  // ── Play / Pause toggle ───────────────────────────────────────────────
  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      userPausedRef.current = false;
      try {
        await video.play();
        setPlaying(true);
        setError("");
      } catch {
        setError("Clique em play para iniciar a transmissao.");
      }
    } else {
      userPausedRef.current = true; // remember user paused explicitly
      video.pause();
      setPlaying(false);
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.code === "Space") { e.preventDefault(); togglePlayback(); }
      if (e.key.toLowerCase() === "m") setMuted((v) => !v);
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      if (e.key === "ArrowUp") { e.preventDefault(); setVolume((v) => Math.min(1, +(v + 0.05).toFixed(2))); setMuted(false); }
      if (e.key === "ArrowDown") { e.preventDefault(); setVolume((v) => Math.max(0, +(v - 0.05).toFixed(2))); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // ── Fullscreen change listener ────────────────────────────────────────
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const seek = (value: string) => {
    const video = videoRef.current;
    if (!video || duration <= 0 || !Number.isFinite(duration)) return;
    video.currentTime = (Number(value) / 100) * duration;
    setCurrentTime(video.currentTime);
  };

  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else player.requestFullscreen();
  };

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div ref={playerRef} className="relative flex h-full min-h-0 flex-col overflow-hidden bg-black">
      {/* ── Video area ── */}
      <div
        className="relative min-h-0 flex-1 bg-black cursor-pointer select-none"
        onClick={togglePlayback}
        onDoubleClick={toggleFullscreen}
      >
        <video
          ref={videoRef}
          className="h-full w-full bg-black object-contain"
          playsInline
          muted={muted}
          poster={live.banner || live.thumbnail}
          onPlay={() => { setPlaying(true); setError(""); }}
          onPause={() => setPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration || 0); setBuffering(false); }}
          onTimeUpdate={(e) => { setCurrentTime(e.currentTarget.currentTime); setDuration(e.currentTarget.duration || 0); }}
        />

        {/* Top-left badges */}
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E50914] px-3 py-1 text-xs font-black text-white shadow-lg">
            <span className="h-2 w-2 rounded-full bg-white live-badge" />
            AO VIVO
          </span>
          <span className="hidden rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-gray-200 backdrop-blur-sm sm:inline">
            {activeServer.name}
          </span>
        </div>

        {/* Center overlays */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {!playing && !buffering && !adOverlay && (
            <div className="rounded-full border border-white/20 bg-black/70 p-5 shadow-2xl backdrop-blur-sm">
              <Play className="h-10 w-10 fill-white text-white" />
            </div>
          )}
          {buffering && (
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/70 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
              <Radio className="h-4 w-4 animate-pulse text-[#E50914]" />
              A carregar transmissao...
            </div>
          )}
          {error && !playing && (
            <div className="max-w-sm rounded-xl border border-red-500/30 bg-red-950/80 px-5 py-4 text-center text-sm font-semibold text-red-100 backdrop-blur-sm">
              {error}
              <p className="mt-2 text-xs text-red-300 opacity-75">Tente selecionar outro servidor abaixo</p>
            </div>
          )}
          {autoPlayMuted && muted && playing && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMuted(false); }}
              className="pointer-events-auto rounded-lg border border-white/20 bg-black/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/95"
            >
              🔊 Ativar som
            </button>
          )}
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="border-t border-white/10 bg-[#0F0F0F] px-4 py-3">
        {/* Timeline */}
        <div className="mb-3 flex items-center gap-3">
          <span className="w-12 shrink-0 text-xs font-medium text-gray-400">{formatTime(currentTime)}</span>
          <div className="relative flex-1 group">
            <input
              aria-label="Progresso do video"
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={(e) => seek(e.target.value)}
              className="h-1 w-full accent-[#E50914] cursor-pointer"
            />
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-medium text-gray-400">
            {Number.isFinite(duration) && duration > 0 ? formatTime(duration) : "LIVE"}
          </span>
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={togglePlayback}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black transition-colors hover:bg-gray-200 active:scale-95"
            title={playing ? "Pausar (Espaço)" : "Reproduzir (Espaço)"}
          >
            {playing ? <Pause className="h-5 w-5 fill-black" /> : <Play className="h-5 w-5 fill-black" />}
          </button>

          {/* Mute */}
          <button
            onClick={() => setMuted((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/15"
            title={muted ? "Ativar som (M)" : "Silenciar (M)"}
          >
            <VolumeIcon className="h-5 w-5" />
          </button>

          {/* Volume slider */}
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
            className="h-1 w-24 accent-[#E50914] sm:w-32 cursor-pointer"
          />

          {/* Server selector + fullscreen */}
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-lg bg-white/8 px-3 py-2 text-xs font-semibold text-gray-300 md:flex">
              <Server className="h-3.5 w-3.5 text-[#E50914]" />
              Servidores
            </div>
            <div className="flex max-w-full gap-1 overflow-x-auto">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => { setServerId(server.id); userPausedRef.current = false; }}
                  className={cn(
                    "whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold transition-all",
                    server.id === serverId
                      ? "border-[#E50914] bg-[#E50914] text-white"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                  title={`${server.quality} · latência ${server.latency}`}
                >
                  {server.name}
                </button>
              ))}
            </div>
            <button
              onClick={toggleFullscreen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/15"
              title={fullscreen ? "Sair de ecrã inteiro (F)" : "Ecrã inteiro (F)"}
            >
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Hint row */}
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-600">
          <span>Espaço: play/pause · M: silenciar · F: ecrã inteiro · ↑↓: volume</span>
          <span>{formatNumber(live.viewerCount)} espectadores</span>
        </div>
      </div>
    </div>
  );
}
