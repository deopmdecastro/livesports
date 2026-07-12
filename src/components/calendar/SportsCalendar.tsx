"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { useLang } from "@/lib/lang";
import {
  fetchSportsCalendar,
  fetchSportsLeagues,
  fetchSportsList,
  formatEventTime,
  shiftDate,
  todayDateString,
  type SportsCalendarEvent,
  type SportsCalendarLeague,
  type SportsCalendarSport,
} from "@/lib/thesportsdb";
import { TeamSearch } from "@/components/thesportsdb/TeamSearch";
import type { SportsTeamSearchResult } from "@/lib/thesportsdb";

const STATUS_STYLES = {
  upcoming: "border-[#2A2A2A] bg-white/[0.03] text-gray-400",
  live: "border-[#E50914]/40 bg-[#E50914]/15 text-[#FF3B44]",
  finished: "border-[#2A2A2A] bg-white/[0.02] text-gray-500",
  cancelled: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function statusLabel(status: SportsCalendarEvent["status"], lang: "pt" | "en") {
  const labels = {
    pt: { upcoming: "Agendado", live: "Ao vivo", finished: "Terminado", cancelled: "Cancelado" },
    en: { upcoming: "Scheduled", live: "Live", finished: "Finished", cancelled: "Cancelled" },
  };
  return labels[lang][status];
}

function TeamCrest({ badge }: { badge: string | null }) {
  if (badge) return <img src={badge} alt="" className="h-7 w-7 flex-shrink-0 object-contain" />;
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1A1C2A] text-gray-600">
      <Trophy className="h-3.5 w-3.5" />
    </div>
  );
}

function EventCard({ event, lang }: { event: SportsCalendarEvent; lang: "pt" | "en" }) {
  const isMatch = Boolean(event.homeTeam && event.awayTeam);
  const isLive = event.status === "live";

  return (
    <div
      className={`flex flex-col gap-3 border-b border-[#1A1C2A] px-4 py-3.5 last:border-0 hover:bg-white/[0.015] sm:flex-row sm:items-center sm:gap-4 ${
        isLive ? "bg-[#E50914]/[0.03]" : ""
      }`}
    >
      {/* Time */}
      <div className="flex items-center gap-2 sm:w-16 sm:flex-col sm:items-start sm:gap-0.5">
        <span className="font-mono text-sm font-bold tabular-nums text-white">
          {formatEventTime(event, lang)}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#FF3B44]">
            <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#E50914]" />
            {lang === "pt" ? "Direto" : "Live"}
          </span>
        ) : null}
      </div>

      {/* Match / event body */}
      <div className="min-w-0 flex-1">
        {isMatch ? (
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <div className="flex flex-1 items-center justify-end gap-2 sm:flex-initial sm:w-[38%]">
              <span className="truncate text-right text-sm font-semibold text-white">{event.homeTeam}</span>
              <TeamCrest badge={event.homeBadge} />
            </div>
            <span
              className={`flex-shrink-0 rounded-md px-2 py-1 text-center text-sm font-black ${
                event.status === "upcoming" ? "text-gray-500" : "bg-white/[0.04] text-white"
              }`}
            >
              {event.status === "upcoming" ? "vs" : `${event.homeScore ?? 0} – ${event.awayScore ?? 0}`}
            </span>
            <div className="flex flex-1 items-center gap-2 sm:flex-initial sm:w-[38%]">
              <TeamCrest badge={event.awayBadge} />
              <span className="truncate text-sm font-semibold text-white">{event.awayTeam}</span>
            </div>
          </div>
        ) : (
          <p className="truncate text-center text-sm font-semibold text-white sm:text-left">{event.title}</p>
        )}
        {event.venue ? (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-gray-500 sm:justify-start">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </p>
        ) : null}
      </div>

      {/* Status */}
      <div className="flex justify-center sm:w-28 sm:justify-end">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[event.status]}`}
        >
          {statusLabel(event.status, lang)}
        </span>
      </div>
    </div>
  );
}

function LeagueGroup({
  league,
  leagueBadge,
  round,
  events,
  lang,
}: {
  league: string;
  leagueBadge: string | null;
  round: string | null;
  events: SportsCalendarEvent[];
  lang: "pt" | "en";
}) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-[#1A1C2A] bg-white/[0.015] px-4 py-2.5">
        {leagueBadge ? (
          <img src={leagueBadge} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <Trophy className="h-4 w-4 text-gray-600" />
        )}
        <span className="text-xs font-bold text-gray-300">{league}</span>
        {round ? <span className="text-[11px] text-gray-600">· {round}</span> : null}
        <span className="ml-auto text-[11px] text-gray-600">{events.length}</span>
      </div>
      {events.map((event) => (
        <EventCard key={event.id} event={event} lang={lang} />
      ))}
    </div>
  );
}

function dayPillLabel(date: string, locale: "pt" | "en") {
  const parsed = new Date(`${date}T12:00:00`);
  const weekday = parsed
    .toLocaleDateString(locale === "pt" ? "pt-PT" : "en-US", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  return { weekday, day: parsed.getDate() };
}

interface SportsCalendarProps {
  initialSport?: string;
  initialDate?: string;
  showHeader?: boolean;
}

export default function SportsCalendar({
  initialSport = "Soccer",
  initialDate,
  showHeader = true,
}: SportsCalendarProps) {
  const { lang } = useLang();
  const locale = lang === "pt" ? "pt" : "en";
  const [date, setDate] = useState(initialDate || todayDateString());
  const [sport, setSport] = useState(initialSport);
  const [leagueId, setLeagueId] = useState("");
  const [sports, setSports] = useState<SportsCalendarSport[]>([]);
  const [leagues, setLeagues] = useState<SportsCalendarLeague[]>([]);
  const [events, setEvents] = useState<SportsCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [source, setSource] = useState<string>("thesportsdb");
  const [selectedTeam, setSelectedTeam] = useState<SportsTeamSearchResult | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const today = useMemo(() => todayDateString(), []);
  const isToday = date === today;

  const selectedLeague = useMemo(
    () => leagues.find((league) => league.id === leagueId) || null,
    [leagues, leagueId],
  );

  const dayStrip = useMemo(() => {
    const offsets = [-3, -2, -1, 0, 1, 2, 3];
    return offsets.map((offset) => shiftDate(date, offset));
  }, [date]);

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { league: string; leagueBadge: string | null; round: string | null; items: SportsCalendarEvent[] }
    >();
    events.forEach((event) => {
      const key = event.leagueId || event.league;
      if (!map.has(key)) {
        map.set(key, { league: event.league, leagueBadge: event.leagueBadge, round: event.round, items: [] });
      }
      map.get(key)!.items.push(event);
    });
    return Array.from(map.values());
  }, [events]);

  useEffect(() => {
    fetchSportsList()
      .then((data) => setSports(data.sports))
      .catch(() => setSports([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingLeagues(true);
    fetchSportsLeagues(sport)
      .then((data) => {
        if (cancelled) return;
        setLeagues(data.leagues);
        setLeagueId((current) => {
          if (current && data.leagues.some((league) => league.id === current)) return current;
          return "";
        });
      })
      .catch(() => {
        if (!cancelled) setLeagues([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingLeagues(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sport]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchSportsCalendar({
      date,
      sport,
      leagueId: leagueId || undefined,
      season: selectedLeague?.currentSeason || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setEvents(data.events);
        setNotice(data.notice || null);
        setFailed(false);
        setSource(data.source);
      })
      .catch(() => {
        if (!cancelled) {
          setEvents([]);
          setFailed(true);
          setNotice(lang === "pt" ? "Não foi possível carregar o calendário." : "Could not load calendar.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, sport, leagueId, selectedLeague?.currentSeason, lang, retryToken]);

  return (
    <section className="relative overflow-hidden py-8 lg:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-[#E50914]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 lg:px-6">
        {showHeader ? (
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E50914]/30 bg-[#E50914]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#E50914]">
                <CalendarDays className="h-3.5 w-3.5" />
                {lang === "pt" ? "Calendário Desportivo" : "Sports Calendar"}
              </div>
              <h1
                className="text-3xl font-black text-white lg:text-4xl"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {lang === "pt" ? "Jogos e Eventos do Dia" : "Games and Events Today"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                {lang === "pt"
                  ? "Calendário alimentado pela TheSportsDB com ligas e competições de todo o mundo."
                  : "Calendar powered by TheSportsDB with leagues and competitions worldwide."}
              </p>
            </div>

            <a
              href="https://www.thesportsdb.com/browse_calendar"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition-colors hover:text-white"
            >
              TheSportsDB
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : null}

        {/* ── Toolbar: day strip + team search + league filter ── */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-[#1E1E2A] bg-[#0E0E16]/80">
          {/* Day strip */}
          <div className="flex items-center gap-2 border-b border-[#1A1C2A] px-3 py-3">
            <button
              type="button"
              onClick={() => setDate((current) => shiftDate(current, -1))}
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#14141C] text-gray-300 transition-colors hover:bg-[#1E1E2A]"
              aria-label={lang === "pt" ? "Dia anterior" : "Previous day"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex flex-1 justify-between gap-1 overflow-x-auto sm:justify-center sm:gap-2">
              {dayStrip.map((d) => {
                const { weekday, day } = dayPillLabel(d, locale);
                const active = d === date;
                const isTodayPill = d === today;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className={`flex w-12 flex-shrink-0 flex-col items-center gap-0.5 rounded-lg border py-1.5 transition-colors ${
                      active
                        ? "border-[#E50914]/50 bg-[#E50914]/15 text-white"
                        : "border-transparent text-gray-500 hover:bg-white/[0.03] hover:text-gray-300"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wide">{weekday}</span>
                    <span className="text-sm font-black">{day}</span>
                    {isTodayPill ? (
                      <span className={`h-1 w-1 rounded-full ${active ? "bg-white" : "bg-[#E50914]"}`} />
                    ) : (
                      <span className="h-1 w-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setDate((current) => shiftDate(current, 1))}
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#14141C] text-gray-300 transition-colors hover:bg-[#1E1E2A]"
              aria-label={lang === "pt" ? "Dia seguinte" : "Next day"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {!isToday ? (
              <button
                type="button"
                onClick={() => setDate(today)}
                className="hidden flex-shrink-0 rounded-lg border border-[#E50914]/30 bg-[#E50914]/10 px-3 py-2 text-xs font-bold text-[#E50914] transition-colors hover:bg-[#E50914]/20 sm:block"
              >
                {lang === "pt" ? "Hoje" : "Today"}
              </button>
            ) : null}
          </div>

          {/* Search + league filter */}
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <div className="sm:w-[40%]">
              <TeamSearch
                label={lang === "pt" ? "Pesquisar equipa" : "Search team"}
                placeholder={lang === "pt" ? "Ex: Arsenal, Benfica..." : "E.g. Arsenal, Benfica..."}
                hint={
                  lang === "pt"
                    ? "Dados via searchteams.php · chave free limitada a algumas equipas"
                    : "Data via searchteams.php · free key limited to some teams"
                }
                onSelect={(team) => {
                  setSelectedTeam(team);
                  if (team.sport) setSport(team.sport);
                }}
              />
            </div>

            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              {selectedTeam ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-[#2A2A2A] bg-[#14141C] px-3 py-2">
                  {selectedTeam.badge ? (
                    <img src={selectedTeam.badge} alt="" className="h-8 w-8 object-contain" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{selectedTeam.name}</p>
                    <p className="truncate text-[10px] text-gray-500">
                      {[selectedTeam.league, selectedTeam.country].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              ) : null}
              <select
                value={leagueId}
                onChange={(event) => setLeagueId(event.target.value)}
                disabled={loadingLeagues}
                className="input-dark px-3 py-2.5 text-sm disabled:opacity-60 sm:w-56"
              >
                <option value="">{lang === "pt" ? "Todas as ligas" : "All leagues"}</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.country ? `${league.name} (${league.country})` : league.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Sport filter pills ── */}
        <div className="mb-5 flex flex-wrap gap-2">
          {(sports.length ? sports : [{ id: "Soccer", label: "Futebol", slug: "soccer" }]).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSport(item.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                sport === item.id
                  ? "border-[#E50914]/40 bg-[#E50914]/15 text-[#E50914]"
                  : "border-[#2A2A2A] bg-[#14141C] text-gray-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ── Results ── */}
        <div className="overflow-hidden rounded-2xl border border-[#1E1E2A] bg-[#0E0E16]/80">
          <div className="flex items-center justify-between border-b border-[#1E1E2A] px-4 py-3">
            <p className="text-sm font-bold text-white">
              {loading
                ? lang === "pt"
                  ? "A carregar calendário..."
                  : "Loading calendar..."
                : lang === "pt"
                  ? `${events.length} evento${events.length === 1 ? "" : "s"} encontrado${events.length === 1 ? "" : "s"}`
                  : `${events.length} event${events.length === 1 ? "" : "s"} found`}
            </p>
            <span className="text-[11px] uppercase tracking-widest text-gray-500">{source}</span>
          </div>

          {notice && events.length > 0 ? (
            <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 text-xs text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {notice}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {lang === "pt" ? "A consultar TheSportsDB..." : "Fetching from TheSportsDB..."}
            </div>
          ) : events.length > 0 ? (
            <div>
              {groups.map((group) => (
                <LeagueGroup
                  key={group.league + group.round}
                  league={group.league}
                  leagueBadge={group.leagueBadge}
                  round={group.round}
                  events={group.items}
                  lang={locale}
                />
              ))}
            </div>
          ) : failed ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="max-w-sm text-sm text-gray-400">{notice}</p>
              <button
                type="button"
                onClick={() => setRetryToken((n) => n + 1)}
                className="mt-1 inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#14141C] px-4 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-[#1E1E2A] hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {lang === "pt" ? "Tentar novamente" : "Try again"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A2A] bg-white/[0.02] text-gray-600">
                <CalendarX2 className="h-5 w-5" />
              </div>
              <p className="text-sm text-gray-500">
                {lang === "pt"
                  ? "Nenhum evento encontrado para esta data e filtro."
                  : "No events found for this date and filter."}
              </p>
              <a
                href="https://www.thesportsdb.com/browse_calendar"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#E50914] hover:underline"
              >
                {lang === "pt" ? "Ver calendário completo" : "View full calendar"}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
