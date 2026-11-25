import Link from "next/link";
import type { Metadata } from "next";
import { BarChart3, CalendarClock, Eye, Play, Radio, Trophy, Users, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import type { Event, Live, SportCategory } from "@/types";
import { formatNumber, getSportLabel } from "@/utils";
import { serverApiRequest } from "@/lib/server-api";
import type { ApiListResponse } from "@/lib/api";
import StaticPageClient from "@/components/static/StaticPageClient";
import { getStaticPageContent, type StaticPageSlug } from "@/lib/static-pages-content";
import AdSlot from "@/components/ads/AdSlot";
import ResilientLogo from "@/components/ui/ResilientLogo";

export const dynamic = "force-dynamic";

const slugToSport: Record<string, SportCategory | "all-live" | "empty" | "blank"> = {
  "ao-vivo": "all-live",
  futebol: "football",
  basquete: "basketball",
  tenis: "tennis",
  volei: "volleyball",
  ufc: "ufc",
  f1: "f1",
  beisebol: "baseball",
  outros: "other",
  natacao: "empty",
  ciclismo: "empty",
  atletismo: "empty",
  golfe: "empty",
  about: "blank",
  careers: "blank",
  press: "blank",
  partners: "blank",
  help: "blank",
  contact: "blank",
  plans: "blank",
  faq: "blank",
  terms: "blank",
  privacy: "blank",
  cookies: "blank",
  dmca: "blank",
};

const slugLabels: Record<string, string> = {
  "ao-vivo": "Transmissões em Direto",
  futebol: "Futebol",
  basquete: "Basquetebol",
  tenis: "Ténis",
  volei: "Voleibol",
  ufc: "UFC & Artes Marciais",
  f1: "Fórmula 1",
  beisebol: "Beisebol",
  outros: "Outros Desportos",
  natacao: "Natação",
  ciclismo: "Ciclismo",
  atletismo: "Atletismo",
  golfe: "Golfe",
  about: "Sobre Nós",
  careers: "Carreiras",
  press: "Imprensa",
  partners: "Parceiros",
  help: "Central de Ajuda",
  contact: "Contacto",
  plans: "Planos",
  faq: "FAQ",
  terms: "Termos de Uso",
  privacy: "Privacidade",
  cookies: "Cookies",
  dmca: "DMCA",
};

const SPORT_FALLBACK_THUMBS: Record<string, string> = {
  football: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=80",
  basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80",
  tennis: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=900&q=80",
  ufc: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=900&q=80",
  f1: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&q=80",
  default: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80",
};

function formatKickoff(value?: string) {
  if (!value) return "Em breve";
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Agendado";
  }
}

function StreamCard({ live }: { live: Live }) {
  const isLive = live.status === "live";
  const thumb =
    live.thumbnail ||
    live.banner ||
    SPORT_FALLBACK_THUMBS[live.sport] ||
    SPORT_FALLBACK_THUMBS.default;
  const hasScore = typeof live.scoreA === "number" && typeof live.scoreB === "number";

  return (
    <Link
      href={`/watch/${live.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#11131F] to-[#0A0C14] transition-all duration-300 hover:-translate-y-1 hover:border-[#E50914]/50 hover:shadow-[0_18px_50px_rgba(229,9,20,0.16)]"
    >
      <div className="relative aspect-video overflow-hidden bg-[#161926]">
        <img
          src={thumb}
          alt={live.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080910] via-[#080910]/35 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          {isLive ? (
            <span className="badge-live">
              <span className="badge-live-dot" /> AO VIVO
            </span>
          ) : (
            <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/85 backdrop-blur-md">
              PROGRAMADO
            </span>
          )}
          {live.matchTime && (
            <span className="rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
              {live.matchTime}
            </span>
          )}
        </div>

        {/* Team Crests Overlay if present */}
        {(live.teamALogo || live.teamBLogo || (live.teamA && live.teamB)) && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/65 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              {(live.teamALogo || live.teamA) && (
                <ResilientLogo src={live.teamALogo} name={live.teamA} kind="team" size={24} alt={live.teamA || ""} className="h-6 w-6 shrink-0" />
              )}
              <span className="truncate text-xs font-bold text-white">{live.teamA}</span>
            </div>
            <span className="px-2 text-sm font-black text-white tabular-nums">
              {hasScore ? `${live.scoreA} - ${live.scoreB}` : "VS"}
            </span>
            <div className="flex items-center gap-2 min-w-0 justify-end">
              <span className="truncate text-xs font-bold text-white">{live.teamB}</span>
              {(live.teamBLogo || live.teamB) && (
                <ResilientLogo src={live.teamBLogo} name={live.teamB} kind="team" size={24} alt={live.teamB || ""} className="h-6 w-6 shrink-0" />
              )}
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#E50914] p-3.5 shadow-[0_0_30px_rgba(229,9,20,0.65)]">
            <Play className="ml-0.5 h-5 w-5 fill-current text-white" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#ff5e67] truncate">
            {live.league || getSportLabel(live.sport)}
          </p>
          <h2 className="mb-3 line-clamp-2 text-base font-bold text-white group-hover:text-white/95">
            {live.title}
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-xs text-white/50">
          <span className="font-semibold text-white/75">{getSportLabel(live.sport)}</span>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(live.viewerCount || 0)} a assistir
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-[#E50914]" />
              {formatKickoff(live.scheduledAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function MatchEventCard({ event }: { event: Event }) {
  const isLive = event.status === "live";
  const isFinished = event.status === "finished";
  const hasScore = typeof event.scoreA === "number" && typeof event.scoreB === "number";
  const scorers = event.matchDetails?.scorers || [];
  const hasLiveStream = Boolean(event.liveTag?.liveId);

  return (
    <div
      className="group flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#0F111C] to-[#090B12] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#E50914]/40"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            {(event.leagueLogo || event.league) && (
              <ResilientLogo src={event.leagueLogo} name={event.league || event.sport} kind="league" size={20} alt="" className="h-4 w-4 opacity-85" />
            )}
            <span className="truncate text-[11px] font-bold uppercase tracking-wider text-white/45">
              {event.league || getSportLabel(event.sport)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasLiveStream && (
              <Link
                href={`/watch/${event.liveTag!.liveId}`}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border transition-all ${
                  event.liveTag!.liveStatus === "live"
                    ? "bg-[#E50914] text-white border-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.4)]"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25"
                }`}
              >
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                {event.liveTag!.liveStatus === "live" ? "LIVE" : "TEM LIVE"}
              </Link>
            )}
            {isLive ? (
              <span className="badge-live"><span className="badge-live-dot" /> AO VIVO</span>
            ) : (
              <span className={`badge text-[10px] px-2 py-0.5 ${isFinished ? "badge-green" : "badge-blue"}`}>
                {isFinished ? "Terminado" : event.matchTime || "Agendado"}
              </span>
            )}
          </div>
        </div>

        <Link href={`/evento/${encodeURIComponent(event.id)}`} className="block">
          <div className="flex items-center justify-between gap-3 my-4">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <ResilientLogo
                src={event.teamALogo}
                name={event.teamA || event.title}
                code={event.teamACode}
                kind="team"
                size={44}
                alt={event.teamA || ""}
                className="h-11 w-11"
              />
              <span className="w-full truncate text-center text-xs font-bold text-white/90 group-hover:text-white">
                {event.teamA || event.title}
              </span>
            </div>

            <div className="shrink-0 px-2 text-center">
              {hasScore ? (
                <div className="text-2xl font-black text-white tabular-nums">
                  {event.scoreA} <span className="text-white/25">–</span> {event.scoreB}
                </div>
              ) : (
                <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-black text-white/55">
                  VS
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <ResilientLogo
                src={event.teamBLogo}
                name={event.teamB}
                code={event.teamBCode}
                kind="team"
                size={44}
                alt={event.teamB || ""}
                className="h-11 w-11"
              />
              <span className="w-full truncate text-center text-xs font-bold text-white/90 group-hover:text-white">
                {event.teamB || "—"}
              </span>
            </div>
          </div>

          {scorers.length > 0 && (
            <div className="mb-3 pt-2.5 border-t border-white/[0.05] flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-white/70">
              {scorers.slice(0, 4).map((s, idx) => (
                <span key={idx} className="inline-flex items-center gap-1">
                  <span className="text-emerald-400">⚽</span>
                  <span className="font-semibold text-white/90">{s.player}</span>
                  <span className="text-white/40">{s.minute}</span>
                </span>
              ))}
            </div>
          )}
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/[0.05] pt-3 text-[11px] text-white/45">
        <Link
          href={`/evento/${encodeURIComponent(event.id)}`}
          className="inline-flex items-center gap-1.5 font-bold text-white/75 hover:text-white transition-colors"
        >
          <BarChart3 className="h-3.5 w-3.5 text-[#E50914]" />
          Estatísticas completas
        </Link>
        {hasLiveStream ? (
          <Link
            href={`/watch/${event.liveTag!.liveId}`}
            className="inline-flex items-center gap-1 rounded-md bg-[#E50914]/15 border border-[#E50914]/35 px-2.5 py-1 text-[10px] font-black text-[#ff6b73] hover:bg-[#E50914] hover:text-white transition-all"
          >
            <Zap className="h-3 w-3" />
            Assistir Live
          </Link>
        ) : (
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-[#E50914]/80" />
            {formatKickoff(event.scheduledAt)}
          </span>
        )}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(slugToSport).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = slugToSport[slug];
  if (!category) return {};

  if (category === "blank") {
    const content = getStaticPageContent(slug as StaticPageSlug, "pt");
    return {
      title: `${content.title} | LiveSports`,
      description: content.subtitle || content.sections?.[0]?.body?.[0]?.slice(0, 160),
    };
  }

  const label = slugLabels[slug];
  return {
    title: label ? `${label} em Direto | LiveSports` : undefined,
    description: label
      ? `Acompanhe transmissões ao vivo, resultados e jogos agendados de ${label} na LiveSports.`
      : undefined,
  };
}

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = slugToSport[slug];
  if (!category) notFound();

  if (category === "blank") {
    return <StaticPageClient slug={slug as StaticPageSlug} />;
  }

  const [liveData, eventsData] =
    category === "empty"
      ? [null, null]
      : await Promise.all([
          serverApiRequest<ApiListResponse<Live>>(
            category === "all-live" ? "/lives?status=live&limit=100" : `/lives?sport=${category}&limit=100`,
          ),
          serverApiRequest<Event[]>(
            category === "all-live" ? "/events?status=live&limit=100" : `/events?sport=${category}&limit=100`,
          ),
        ]);

  const lives = liveData?.items || [];
  const events = Array.isArray(eventsData) ? eventsData : [];
  const title = slugLabels[slug];

  return (
    <section className="min-h-[75vh] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-10">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-7">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E50914]/30 bg-[#E50914]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff666e]">
              <Radio className="h-3.5 w-3.5" />
              LiveSports · Oficial
            </div>
            <h1
              className="text-4xl font-black text-white lg:text-5xl"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55 lg:text-base">
              Transmissões em direto com múltiplos servidores HLS, marcadores em tempo real e calendário atualizado de jogos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/calendario"
              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/85 hover:border-white/25 hover:bg-white/[0.08]"
            >
              Calendário Completo
            </Link>
          </div>
        </div>

        {/* Streams Section */}
        {lives.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="badge-live"><span className="badge-live-dot" /> CANAIS & STREAMS</span>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Canais de Transmissão ({lives.length})
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lives.map((live) => (
                <StreamCard key={live.id} live={live} />
              ))}
            </div>
          </div>
        )}

        {/* Sponsor Slot */}
        <AdSlot position="in_content" hideWhenEmpty />

        {/* Real Fixtures & Scoreboard Events */}
        {events.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-[#E50914]" />
              <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Jogos Oficiais & Resultados ({events.length})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((ev) => (
                <MatchEventCard key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        )}

        {lives.length === 0 && events.length === 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#10121C] p-10 text-center">
            <h2 className="text-lg font-bold text-white">
              Sem transmissões ou partidas agendadas neste momento
            </h2>
            <p className="mt-2 text-sm text-white/50">
              Explore o calendário completo ou acompanhe os canais principais em direto.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/ao-vivo"
                className="rounded-full bg-[#E50914] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
              >
                Ver Canais em Direto
              </Link>
              <Link
                href="/calendario"
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80"
              >
                Abrir Calendário
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
