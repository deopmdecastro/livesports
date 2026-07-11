"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Filter,
  Globe2,
  Languages,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import { mockEvents, mockLives, mockNews } from "@/lib/mock-data";
import { useLang } from "@/lib/lang";
import {
  articleMatchesSearch,
  buildArticleGroups,
  findTranslationVariant,
  groupMatchesLanguage,
  normalizeArticleLanguage,
  pickPreferredVariant,
  type BlogLanguageFilter,
  type NewsArticleGroup,
} from "@/lib/blog";
import type { Event, Live, NewsArticle, SportCategory } from "@/types";
import { formatDateTime, formatNumber, formatRelativeTime, getSportLabel } from "@/utils";

const sportFilters: Array<{ value: "all" | SportCategory; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "football", label: "Futebol" },
  { value: "basketball", label: "Basquete" },
  { value: "tennis", label: "Tênis" },
  { value: "ufc", label: "UFC" },
  { value: "f1", label: "F1" },
  { value: "volleyball", label: "Vôlei" },
  { value: "baseball", label: "Beisebol" },
  { value: "other", label: "Outros" },
];

const languageFilters: Array<{ value: BlogLanguageFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
];

function byScheduledDateAsc<T extends { scheduledAt?: string; publishedAt?: string; createdAt?: string }>(a: T, b: T) {
  const aTs = new Date(a.scheduledAt || a.publishedAt || a.createdAt || 0).getTime();
  const bTs = new Date(b.scheduledAt || b.publishedAt || b.createdAt || 0).getTime();
  return aTs - bTs;
}

function getPreferredUiLanguage(currentLang: string): "pt" | "en" {
  return currentLang === "en" ? "en" : "pt";
}

function NewsCard({ group }: { group: NewsArticleGroup }) {
  const { lang } = useLang();
  const uiLang = getPreferredUiLanguage(lang);
  const [preferredLanguage, setPreferredLanguage] = useState<BlogLanguageFilter>("all");

  useEffect(() => {
    setPreferredLanguage("all");
  }, [group.groupId]);

  const article = useMemo(
    () => pickPreferredVariant(group, preferredLanguage, uiLang),
    [group, preferredLanguage, uiLang]
  );

  const translationTarget = useMemo(
    () => findTranslationVariant(group, article.id),
    [group, article.id]
  );

  const articleLanguage = normalizeArticleLanguage(article);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#111118] shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-0.5 hover:border-[#E50914]/40">
      <div className="relative aspect-[16/9] overflow-hidden bg-[#1A1A1A]">
        <img
          src={article.thumbnail || `https://picsum.photos/seed/news-${article.id}/900/500`}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          {article.featured ? (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-300">
              Destaque
            </span>
          ) : null}
          <span className="rounded-full border border-[#E50914]/20 bg-[#E50914]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8087]">
            {getSportLabel(article.sport || "other")}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[11px] text-white/80">
          <Clock3 className="h-3.5 w-3.5 text-[#E50914]" />
          <span>{formatRelativeTime(article.publishedAt || article.createdAt)}</span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
          {articleLanguage ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-semibold uppercase tracking-[0.16em] text-white/70">
              {articleLanguage}
            </span>
          ) : null}
          {group.availableLanguages.length > 1 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-300">
              <Languages className="h-3 w-3" />
              Tradução disponível
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="line-clamp-2 text-xl font-black leading-tight text-white">{article.title}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-300">
            {article.excerpt || "Leia a análise completa e acompanhe os bastidores desta notícia no blog LiveSports."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
          {(article.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-4">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{article.author?.name || "Equipa LiveSports"}</span>
            <span>{formatNumber(article.views || 0)} views</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {translationTarget ? (
              <button
                type="button"
                onClick={() => setPreferredLanguage(normalizeArticleLanguage(translationTarget) || "all")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 transition-colors hover:border-emerald-400/30 hover:text-white"
              >
                <Globe2 className="h-3.5 w-3.5 text-emerald-300" />
                {normalizeArticleLanguage(translationTarget) === "en" ? "Traduzir para EN" : "Traduzir para PT"}
              </button>
            ) : null}

            <Link
              href={`/blog/${article.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#E50914] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#B00000]"
            >
              Ler artigo
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function LiveCard({ live }: { live: Live }) {
  const isLive = live.status === "live";

  return (
    <Link
      href={`/watch/${live.id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111118] transition-all hover:border-[#E50914]/35"
    >
      <div className="relative aspect-video overflow-hidden bg-[#1A1A1A]">
        <img
          src={live.thumbnail || `https://picsum.photos/seed/live-${live.id}/640/360`}
          alt={live.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isLive ? "bg-[#E50914] text-white" : "bg-white/10 text-white/90"}`}>
          {isLive ? "Ao vivo" : "Agendado"}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs font-semibold text-[#E50914]">{live.league || getSportLabel(live.sport)}</p>
        <h3 className="line-clamp-2 text-sm font-bold text-white">{live.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{getSportLabel(live.sport)}</span>
          <span>{isLive ? `${formatNumber(live.viewerCount)} assistindo` : formatDateTime(live.scheduledAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/evento/${event.id}`}
      className="rounded-2xl border border-white/10 bg-[#111118] p-4 transition-all hover:border-white/20"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#E50914]">{event.league || getSportLabel(event.sport)}</p>
          <h3 className="mt-1 text-sm font-bold text-white">{event.teamA && event.teamB ? `${event.teamA} vs ${event.teamB}` : event.title}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-white/70">
          {event.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <CalendarDays className="h-3.5 w-3.5 text-[#E50914]" />
        <span>{formatDateTime(event.scheduledAt)}</span>
      </div>
    </Link>
  );
}

export default function BlogClient() {
  const { lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsArticle[]>(mockNews);
  const [lives, setLives] = useState<Live[]>(mockLives.slice(0, 4));
  const [events, setEvents] = useState<Event[]>(mockEvents.slice(0, 4));
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<"all" | SportCategory>("all");
  const [language, setLanguage] = useState<BlogLanguageFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const [newsResult, livesResult, eventsResult] = await Promise.allSettled([
        publicApiRequest<ApiListResponse<NewsArticle>>("/news?limit=200", { cacheTtl: 60_000 }),
        publicApiRequest<ApiListResponse<Live>>("/lives?limit=8", { cacheTtl: 30_000 }),
        publicApiRequest<Event[]>("/events?limit=8", { cacheTtl: 30_000 }),
      ]);

      if (!active) return;

      if (newsResult.status === "fulfilled" && newsResult.value.items?.length) {
        setNews(newsResult.value.items);
      }

      if (livesResult.status === "fulfilled" && livesResult.value.items?.length) {
        setLives(livesResult.value.items);
      }

      if (eventsResult.status === "fulfilled" && eventsResult.value.length) {
        setEvents(eventsResult.value);
      }

      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const uiLang = getPreferredUiLanguage(lang);

  const groupedNews = useMemo(() => buildArticleGroups(news.filter((article) => article.published !== false)), [news]);

  const featuredGroups = useMemo(
    () => groupedNews.filter((group) => group.variants.some((article) => article.featured)).slice(0, 3),
    [groupedNews]
  );

  const filteredGroups = useMemo(() => {
    return groupedNews.filter((group) => {
      if (featuredOnly && !group.variants.some((article) => article.featured)) return false;
      if (sport !== "all" && !group.variants.some((article) => (article.sport || "other") === sport)) return false;
      if (!groupMatchesLanguage(group, language)) return false;
      if (!articleMatchesSearch(group, query)) return false;
      return true;
    });
  }, [featuredOnly, groupedNews, language, query, sport]);

  const liveHighlights = useMemo(
    () => [...lives].sort((a, b) => Number(b.status === "live") - Number(a.status === "live")).slice(0, 4),
    [lives]
  );

  const upcomingEvents = useMemo(
    () => [...events].sort(byScheduledDateAsc).slice(0, 4),
    [events]
  );

  const heroArticle = featuredGroups[0]
    ? pickPreferredVariant(featuredGroups[0], language, uiLang)
    : filteredGroups[0]
      ? pickPreferredVariant(filteredGroups[0], language, uiLang)
      : null;

  return (
    <section className="px-4 py-8 lg:px-6 lg:py-10">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(229,9,20,0.25),_transparent_45%),linear-gradient(135deg,#111118_0%,#09090d_100%)] p-6 lg:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#E50914]/10 blur-3xl" />
            <div className="relative z-10 max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E50914]/20 bg-[#E50914]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF8C92]">
                <Sparkles className="h-3.5 w-3.5" />
                Blog LiveSports
              </div>
              <h1 className="max-w-2xl text-3xl font-black leading-tight text-white lg:text-5xl">
                Notícias, análises e bastidores do desporto em tempo real.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 lg:text-base">
                Agora o /blog mostra notícias publicadas, filtros por categoria e idioma, além de alternância de tradução no mesmo artigo sem duplicar cards em português e inglês.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <TrendingUp className="h-4 w-4 text-[#E50914]" />
                  {groupedNews.length} artigos agrupados
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <Languages className="h-4 w-4 text-emerald-300" />
                  Tradução sob demanda
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <Radio className="h-4 w-4 text-red-400" />
                  Lives + eventos em destaque
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#111118] p-5">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#E50914]">
              <Filter className="h-4 w-4" />
              Filtros rápidos
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-gray-400">Pesquisar</span>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0C0C12] px-3 py-3">
                  <Search className="h-4 w-4 text-white/35" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ex.: futebol, NBA, análise..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>
              </label>

              <div>
                <span className="mb-2 block text-xs font-semibold text-gray-400">Categoria</span>
                <div className="flex flex-wrap gap-2">
                  {sportFilters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSport(item.value)}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${sport === item.value ? "bg-[#E50914] text-white" : "border border-white/10 bg-white/5 text-white/70 hover:text-white"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold text-gray-400">Idioma</span>
                <div className="flex flex-wrap gap-2">
                  {languageFilters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setLanguage(item.value)}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${language === item.value ? "bg-emerald-500 text-[#07130A]" : "border border-white/10 bg-white/5 text-white/70 hover:text-white"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFeaturedOnly((current) => !current)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${featuredOnly ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" : "border-white/10 bg-white/5 text-white/75"}`}
              >
                <span>Somente destaques</span>
                <span>{featuredOnly ? "Ativo" : "Mostrar"}</span>
              </button>
            </div>
          </div>
        </div>

        {heroArticle ? (
          <Link href={`/blog/${heroArticle.slug}`} className="block overflow-hidden rounded-[28px] border border-white/10 bg-[#111118] transition-all hover:border-[#E50914]/30">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_minmax(0,1fr)]">
              <div className="relative min-h-[280px] overflow-hidden bg-[#1A1A1A]">
                <img
                  src={heroArticle.thumbnail || `https://picsum.photos/seed/hero-${heroArticle.id}/1200/700`}
                  alt={heroArticle.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              </div>
              <div className="flex flex-col justify-center p-6 lg:p-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#E50914]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF8C92]">Em destaque</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase text-white/70">{getSportLabel(heroArticle.sport || "other")}</span>
                </div>
                <h2 className="text-2xl font-black leading-tight text-white lg:text-3xl">{heroArticle.title}</h2>
                <p className="mt-4 text-sm leading-7 text-gray-300">{heroArticle.excerpt || "Acompanhe a leitura completa com tradução, categorias filtráveis e conteúdo editorial integrado ao ecossistema LiveSports."}</p>
                <div className="mt-5 flex items-center gap-4 text-xs text-gray-400">
                  <span>{heroArticle.author?.name || "Equipa LiveSports"}</span>
                  <span>{formatRelativeTime(heroArticle.publishedAt || heroArticle.createdAt)}</span>
                  <span>{formatNumber(heroArticle.views || 0)} visualizações</span>
                </div>
              </div>
            </div>
          </Link>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E50914]">Feed editorial</p>
                <h2 className="text-2xl font-black text-white">Últimas notícias</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
                {loading ? "Atualizando..." : `${filteredGroups.length} resultados`}
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-[#111118] p-10 text-center text-sm text-gray-400">
                Nenhuma notícia encontrada com os filtros atuais.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {filteredGroups.map((group) => (
                  <NewsCard key={group.groupId} group={group} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[#111118] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#E50914]">
                <Radio className="h-4 w-4" />
                Lives em destaque
              </div>
              <div className="space-y-3">
                {liveHighlights.map((live) => (
                  <LiveCard key={live.id} live={live} />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#111118] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                <CalendarDays className="h-4 w-4" />
                Próximos eventos
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(229,9,20,0.10),rgba(17,17,24,1))] p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#FF8C92]">
                <RefreshCw className="h-4 w-4" />
                Como funciona agora
              </div>
              <ul className="space-y-3 text-sm leading-6 text-gray-300">
                <li>• O /blog exibe notícias reais ou fallback mock quando a API estiver indisponível.</li>
                <li>• Artigos em PT/EN são agrupados no mesmo card.</li>
                <li>• O botão de tradução troca a variante sem duplicar conteúdo na listagem.</li>
                <li>• Lives, eventos e outras áreas usam mocks como rede de segurança visual.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
