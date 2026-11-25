"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Flame, Globe2, Newspaper, Sparkles } from "lucide-react";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import { useLang } from "@/lib/lang";
import {
  buildArticleGroups,
  normalizeArticleLanguage,
  pickPreferredVariant,
} from "@/lib/blog";
import type { NewsArticle } from "@/types";
import { formatNumber, formatRelativeTime, getSportLabel } from "@/utils";

export default function LatestNewsSection() {
  const { lang } = useLang();
  const uiLang = lang === "en" ? "en" : "pt";
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    publicApiRequest<ApiListResponse<NewsArticle>>("/news?limit=24", { cacheTtl: 60_000 })
      .then((res) => {
        if (!active) return;
        setArticles(res.items || []);
      })
      .catch(() => {
        if (!active) return;
        setArticles([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const displayArticles = useMemo(() => {
    const groups = buildArticleGroups(articles);
    // Prioritize articles matching user's active language, then fill remaining slots
    const mapped = groups.map((group) => pickPreferredVariant(group, uiLang, uiLang));
    const langMatched = mapped.filter((a) => normalizeArticleLanguage(a) === uiLang);
    const others = mapped.filter((a) => normalizeArticleLanguage(a) !== uiLang);
    return [...langMatched, ...others].slice(0, 5);
  }, [articles, uiLang]);

  if (loading) {
    return (
      <section className="py-12 lg:py-16 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7 h-[380px] rounded-3xl anim-shimmer" />
            <div className="lg:col-span-5 grid gap-4">
              {[1, 2, 3].map((k) => (
                <div key={k} className="h-[116px] rounded-2xl anim-shimmer" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (displayArticles.length === 0) return null;

  const [lead, ...rest] = displayArticles;

  return (
    <section className="relative py-12 lg:py-16 border-t border-white/[0.04] overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-10 h-[360px] w-[360px] rounded-full bg-[#E50914]/[0.05] blur-[110px]" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-1.5 rounded-full bg-gradient-to-b from-[#E50914] to-[#B00000] mt-0.5" />
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E50914]/25 bg-[#E50914]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6b73] mb-2">
                <Flame className="h-3 w-3" />
                {lang === "pt" ? "Redação em Tempo Real" : "Live Newsroom"}
              </div>
              <h2
                className="text-2xl lg:text-3xl font-black text-white tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {lang === "pt" ? "Últimas Notícias & Análises" : "Breaking Sports News & Analysis"}
              </h2>
              <p className="text-xs sm:text-sm text-white/45 mt-0.5">
                {lang === "pt"
                  ? "Cobertura verificada das principais ligas, conferências de imprensa e bastidores"
                  : "Verified coverage across top leagues, press conferences and matchday stories"}
              </p>
            </div>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white/85 transition-all hover:border-[#E50914]/40 hover:bg-[#E50914]/10 hover:text-white"
          >
            <Newspaper className="h-3.5 w-3.5 text-[#E50914]" />
            {lang === "pt" ? "Ver Todas as Notícias" : "View All News"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Magazine Layout */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Lead Featured Story */}
          {lead && (
            <Link
              href={`/blog/${lead.slug}`}
              className="group relative lg:col-span-7 flex flex-col justify-end min-h-[360px] sm:min-h-[430px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0C0E16] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-[#E50914]/40"
            >
              <img
                src={lead.thumbnail || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80"}
                alt={lead.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05060B] via-[#05060B]/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#05060B]/85 via-transparent to-transparent" />

              <div className="relative z-10 space-y-3.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E50914] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    {lang === "pt" ? "Destaque Principal" : "Top Story"}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
                    {getSportLabel(lead.sport || "football")}
                  </span>
                  {lead.language && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                      <Globe2 className="h-3 w-3 text-emerald-400" />
                      {lead.language}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-black leading-[1.12] text-white group-hover:text-[#ff7b82] transition-colors">
                  {lead.title}
                </h3>

                {lead.excerpt && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-white/70">
                    {lead.excerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-white/55">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-[#E50914]" />
                      {formatRelativeTime(lead.publishedAt || lead.createdAt)}
                    </span>
                    <span>•</span>
                    <span>{formatNumber(lead.views || 0)} {lang === "pt" ? "leituras" : "reads"}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-bold text-white group-hover:translate-x-1 transition-transform">
                    {lang === "pt" ? "Ler reportagem" : "Read story"}
                    <ArrowRight className="h-3.5 w-3.5 text-[#E50914]" />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Secondary Stories Stack */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {rest.map((item) => (
              <Link
                key={item.id}
                href={`/blog/${item.slug}`}
                className="group flex gap-3.5 sm:gap-4 items-center rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#0E101A] to-[#090B12] p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#E50914]/35 hover:bg-[#121522]"
              >
                <div className="relative h-20 w-24 sm:h-24 sm:w-32 shrink-0 overflow-hidden rounded-xl bg-[#161824]">
                  <img
                    src={item.thumbnail || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80"}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff646c]">
                      {getSportLabel(item.sport || "football")}
                    </span>
                    <span className="text-white/20 text-[10px]">•</span>
                    <span className="text-[11px] text-white/40 truncate">
                      {formatRelativeTime(item.publishedAt || item.createdAt)}
                    </span>
                  </div>

                  <h4 className="line-clamp-2 text-sm sm:text-[15px] font-bold leading-snug text-white/92 group-hover:text-white transition-colors">
                    {item.title}
                  </h4>

                  {item.excerpt && (
                    <p className="hidden sm:line-clamp-1 text-xs text-white/45">
                      {item.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
