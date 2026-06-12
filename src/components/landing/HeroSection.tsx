"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Play } from "lucide-react";
import type { Live } from "@/types";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

function TeamCrest({ logo, name }: { logo?: string; name?: string }) {
  if (isImageValue(logo)) {
    return <img src={logo} alt="" className="h-8 w-8 rounded-full border border-white/10 object-cover" />;
  }

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs font-black text-white">
      {(name || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1600&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=80",
];

function buildSlide(live: Live, index: number) {
  const isLive = live.status === "live";
  return {
    id: live.id,
    title: isLive ? live.title : "Proxima transmissao",
    highlight: isLive ? "ao vivo!" : "em breve!",
    subtitle: live.description || `${live.league || "Liga"} em alta qualidade e com servidores alternativos.`,
    image: live.banner || live.thumbnail || fallbackImages[index % fallbackImages.length],
    live,
    cta: isLive ? "Ver Jogo" : "Abrir Live",
  };
}

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [countdown, setCountdown] = useState({ h: 2, m: 30, s: 45 });
  const [slides, setSlides] = useState<ReturnType<typeof buildSlide>[]>([]);

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=6")
      .then((data) => {
        const nextSlides = data.items
          .filter((live) => live.featured || live.status === "live")
          .slice(0, 3)
          .map(buildSlide);
        setSlides(nextSlides);
      })
      .catch(() => setSlides([]));
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[current];
  if (!slide) return null;

  return (
    <section className="relative h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {slides.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? "opacity-100" : "opacity-0"}`}
        >
          <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />

      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-[#E50914] px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-white live-badge" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {slide.live.status === "live" ? "Ao Vivo Agora" : "Agendado"}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                {slide.live.league} {slide.live.matchTime ? `- ${slide.live.matchTime}` : ""}
              </span>
            </div>

            <h1 className="font-heading mb-4 text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
              {slide.title} <span className="text-[#E50914]">{slide.highlight}</span>
            </h1>

            <p className="mb-6 max-w-lg text-base text-gray-300 lg:text-lg">{slide.subtitle}</p>

            {slide.live.status === "live" && (
              <div className="mb-6 flex w-fit items-center gap-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]/80 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-center">
                  <TeamCrest logo={slide.live.teamALogo} name={slide.live.teamA} />
                  <p className="text-sm font-semibold text-white">{slide.live.teamA}</p>
                </div>
                <div className="px-4 text-center">
                  <div className="score-display text-2xl font-black text-white">
                    {slide.live.scoreA ?? 0} - {slide.live.scoreB ?? 0}
                  </div>
                  <div className="text-xs font-semibold text-[#E50914]">{slide.live.matchTime}</div>
                </div>
                <div className="flex items-center gap-2 text-center">
                  <p className="text-sm font-semibold text-white">{slide.live.teamB}</p>
                  <TeamCrest logo={slide.live.teamBLogo} name={slide.live.teamB} />
                </div>
              </div>
            )}

            {slide.live.status === "scheduled" && (
              <div className="mb-6 flex items-center gap-3">
                <Clock className="h-4 w-4 text-[#E50914]" />
                <span className="text-sm text-gray-300">Comeca em:</span>
                <div className="flex items-center gap-1">
                  {[
                    { v: countdown.h, l: "h" },
                    { v: countdown.m, l: "m" },
                    { v: countdown.s, l: "s" },
                  ].map(({ v, l }) => (
                    <div key={l} className="flex items-center gap-0.5">
                      <span className="min-w-[36px] rounded border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-0.5 text-center font-mono text-sm font-bold text-white">
                        {String(v).padStart(2, "0")}
                      </span>
                      <span className="text-xs text-gray-500">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/watch/${slide.live.id}`}
                className="shadow-red flex items-center gap-2 rounded-lg bg-[#E50914] px-6 py-3 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#B00000] hover:shadow-red-lg"
              >
                <Play className="h-4 w-4 fill-current" />
                {slide.cta}
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Criar Conta Gratis
              </Link>
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4">
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A]/80 transition-all hover:border-[#E50914] hover:bg-[#E50914]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            {slides.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setCurrent(index)}
                className={`h-1.5 rounded-full transition-all ${index === current ? "w-8 bg-[#E50914]" : "w-1.5 bg-gray-600"}`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A]/80 transition-all hover:border-[#E50914] hover:bg-[#E50914]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
