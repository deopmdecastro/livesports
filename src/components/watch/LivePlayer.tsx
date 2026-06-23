"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Maximize,
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
  /** Inicia mudo e tenta autoplay (útil em modais/admin onde o browser bloqueia som). */
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

  const servers = useMemo<Required<LiveStreamServer>[]>(() => {
    const customServers = (live.streamServers || [])
      .filter((server) => server.url?.trim())
      .map((server, index) => ({
        id: server.id || `server-${index}`,
        name: server.name || `Servidor ${index + 1}`,
        quality: server.quality || "Auto",
        latency: server.latency || "Normal",
        url: server.url,
      }));

    if (customServers.length > 0) {
      return customServers;
    }

    const primaryUrl = live.hlsUrl || live.m3u8Url || live.streamUrl || FALLBACK_STREAM_URL;

    return [
      { id: "auto", name: "Servidor Auto", quality: "Auto HD", latency: "Baixa", url: primaryUrl },
      { id: "backup", name: "Backup HLS", quality: "HD", latency: "Media", url: FALLBACK_STREAM_URL },
      { id: "mobile", name: "Mobile", quality: "Adaptavel", latency: "Estavel", url: primaryUrl },
    ];
  }, [live.hlsUrl, live.m3u8Url, live.streamServers, live.streamUrl]);

  const [serverId, setServerId] = useState(servers[0].id);
  const activeServer = servers.find((server) => server.id === serverId) || servers[0];
  const progress = duration > 0 && Number.isFinite(duration) ? (currentTime / duration) * 100 : 100;

  useEffect(() => {
    if (!servers.some((server) => server.id === serverId)) {
      setServerId(servers[0].id);
    }
  }, [serverId, servers]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setBuffering(true);
    setError("");
    setStreamReady(false);

    hlsRef.current?.destroy();
    hlsRef.current = null;
    video.pause();
    setPlaying(false);
    video.removeAttribute("src");
    video.load();

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = activeServer.url;
      const onReady = () => {
        setStreamReady(true);
        setBuffering(false);
      };
      video.addEventListener("loadedmetadata", onReady, { once: true });
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
          setError("Nao foi possivel carregar este servidor. Tente outro servidor.");
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamReady) return;

    if (adOverlay === "preroll" || adOverlay === "checking") {
      video.volume = volume;
      video.muted = true;
      void video.play().then(() => {
        setPlaying(true);
        setError("");
      }).catch(() => undefined);
      return;
    }

    if (adOverlay === "midroll") {
      video.pause();
      setPlaying(false);
      return;
    }

    video.volume = volume;
    video.muted = muted || volume === 0;
    void video.play().then(() => {
      setPlaying(true);
      setError("");
    }).catch(() => {
      if (!playing) {
        setError("Clique em play para iniciar a transmissao.");
      }
    });
  }, [adOverlay, streamReady, muted, volume, autoPlayMuted, playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || adOverlay === "preroll" || adOverlay === "checking" || adOverlay === "midroll") return;
    video.volume = volume;
    video.muted = muted || volume === 0;
  }, [adOverlay, muted, volume]);

  const playContent = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      setPlaying(true);
      setError("");
    } catch {
      setError("Clique em play para iniciar a transmissao.");
    }
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await playContent();
    } else {
      video.pause();
      setPlaying(false);
    }
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      if (tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      }

      if (event.key.toLowerCase() === "m") {
        setMuted((current) => !current);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setVolume((current) => Math.min(1, Number((current + 0.05).toFixed(2))));
        setMuted(false);
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setVolume((current) => Math.max(0, Number((current - 0.05).toFixed(2))));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });


  const seek = (value: string) => {
    const video = videoRef.current;
    if (!video || duration <= 0 || !Number.isFinite(duration)) return;
    const nextTime = (Number(value) / 100) * duration;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  };

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div ref={playerRef} className="relative flex h-full min-h-0 flex-col overflow-hidden bg-black">
      <div className="relative min-h-0 flex-1 bg-black" onClick={togglePlayback}>
        <video
          ref={videoRef}
          className="h-full w-full bg-black object-contain"
          playsInline
          muted={muted}
          poster={live.banner || live.thumbnail}
          onPlay={() => {
            setPlaying(true);
            setError("");
          }}
          onPause={() => setPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration || 0);
            setBuffering(false);
          }}
          onTimeUpdate={(event) => {
            setCurrentTime(event.currentTarget.currentTime);
            setDuration(event.currentTarget.duration || 0);
          }}
        />

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E50914] px-3 py-1 text-xs font-black text-white">
            <span className="h-2 w-2 rounded-full bg-white live-badge" />
            AO VIVO
          </span>
          <span className="hidden rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-gray-200 sm:inline">
            {activeServer.name}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {!playing && !buffering && !adOverlay && (
            <div className="rounded-full border border-white/15 bg-black/60 p-5 shadow-2xl">
              <Play className="h-10 w-10 fill-white text-white" />
            </div>
          )}
          {buffering && (
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-sm font-semibold text-white">
              <Radio className="h-4 w-4 animate-pulse text-[#E50914]" />
              A carregar transmissao
            </div>
          )}
          {error && !playing && (
            <div className="max-w-sm rounded-lg border border-red-500/30 bg-red-950/80 px-4 py-3 text-center text-sm font-semibold text-red-100">
              {error}
            </div>
          )}
          {autoPlayMuted && muted && playing && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMuted(false);
              }}
              className="pointer-events-auto rounded-lg border border-white/20 bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/90"
            >
              Ativar som
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0F0F0F] px-4 py-3">
        <div className="mb-3 flex items-center gap-3">
          <span className="w-12 text-xs font-medium text-gray-400">{formatTime(currentTime)}</span>
          <input
            aria-label="Progresso do video"
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(event) => seek(event.target.value)}
            className="h-1 flex-1 accent-[#E50914]"
          />
          <span className="w-12 text-right text-xs font-medium text-gray-400">
            {Number.isFinite(duration) && duration > 0 ? formatTime(duration) : "LIVE"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={togglePlayback}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black transition-colors hover:bg-gray-200"
            title={playing ? "Pausar" : "Reproduzir"}
          >
            {playing ? <Pause className="h-5 w-5 fill-black" /> : <Play className="h-5 w-5 fill-black" />}
          </button>

          <button
            onClick={() => setMuted((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/15"
            title={muted ? "Ativar som" : "Silenciar"}
          >
            <VolumeIcon className="h-5 w-5" />
          </button>

          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(event) => {
              setVolume(Number(event.target.value));
              setMuted(false);
            }}
            className="h-1 w-24 accent-[#E50914] sm:w-32"
          />

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-gray-200 md:flex">
              <Server className="h-4 w-4 text-[#E50914]" />
              Servidores
            </div>
            <div className="flex max-w-full gap-1 overflow-x-auto">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => setServerId(server.id)}
                  className={cn(
                    "whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold transition-colors",
                    server.id === serverId
                      ? "border-[#E50914] bg-[#E50914] text-white"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                  title={`${server.quality} - latencia ${server.latency}`}
                >
                  {server.name}
                </button>
              ))}
            </div>
            <button
              onClick={toggleFullscreen}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/15"
              title="Tela cheia"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span>Espaço: play/pause · M: silenciar · ↑/↓: volume</span>
          <span>{formatNumber(live.viewerCount)} espectadores base</span>
        </div>
      </div>
    </div>
  );
}
