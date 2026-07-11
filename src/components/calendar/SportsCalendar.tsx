"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MapPin,
  Trophy,
} from "lucide-react";
import { useLang } from "@/lib/lang";
import {
  fetchSportsCalendar,
  fetchSportsLeagues,
  fetchSportsList,
  formatCalendarDate,
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
  upcoming: "bg-red-500/15 text-red-300 border-red-500/30",
  live: "bg-red-500/15 text-red-300 border-red-500/30",
  finished: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  cancelled: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
};

function statusLabel(status: SportsCalendarEvent["status"], lang: "pt" | "en") {
  const labels = {
    pt: { upcoming: "Agendado", live: "Ao vivo", finished: "Terminado", cancelled: "Cancelado" },
    en: { upcoming: "Scheduled", live: "Live", finished: "Finished", cancelled: "Cancelled" },
  };
  return labels[lang][status];
}

function EventRow({ event, lang }: { event: SportsCalendarEvent; lang: "pt" | "en" }) {
  const isMatch = Boolean(event.homeTeam && event.awayTeam);

  return (
    <tr className="border-b border-[#1E1E2A]/80 last:border-0 hover:bg-white/[0.02]">
      <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-gray-300">
        {formatEventTime(event, lang)}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2 text-xs text-gray-400">
          {event.leagueBadge ? (
            <img src={event.leagueBadge} alt="" className="h-5 w-5 rounded object-contain" />
          ) : (
            <Trophy className="h-4 w-4 text-gray-600" />
          )}
          {event.league}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {event.thumbnail ? (
            <img src={event.thumbnail} alt="" className="h-10 w-16 rounded object-cover" />
          ) : null}
          <div>
            {isMatch ? (
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                {event.homeBadge ? <img src={event.homeBadge} alt="" className="h-6 w-6 object-contain" /> : null}
                <span>{event.homeTeam}</span>
                <span className="text-gray-500">
                  {event.status === "upcoming" ? "vs" : `${event.homeScore ?? 0} - ${event.awayScore ?? 0}`}
                </span>
                <span>{event.awayTeam}</span>
                {event.awayBadge ? <img src={event.awayBadge} alt="" className="h-6 w-6 object-contain" /> : null}
              </div>
            ) : (
              <p className="text-sm font-semibold text-white">{event.title}</p>
            )}
            {event.venue ? (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                <MapPin className="h-3 w-3" />
                {event.venue}
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[event.status]}`}
        >
          {statusLabel(event.status, lang)}
        </span>
      </td>
    </tr>
  );
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
  const [source, setSource] = useState<string>("thesportsdb");
  const [selectedTeam, setSelectedTeam] = useState<SportsTeamSearchResult | null>(null);

  const selectedLeague = useMemo(
    () => leagues.find((league) => league.id === leagueId) || null,
    [leagues, leagueId],
  );

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
        setSource(data.source);
      })
      .catch(() => {
        if (!cancelled) {
          setEvents([]);
          setNotice(lang === "pt" ? "Nao foi possivel carregar o calendario." : "Could not load calendar.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, sport, leagueId, selectedLeague?.currentSeason, lang]);

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
                {lang === "pt" ? "Calendario Desportivo" : "Sports Calendar"}
              </div>
              <h1
                className="text-3xl font-black text-white lg:text-4xl"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {lang === "pt" ? "Jogos e Eventos do Dia" : "Games and Events Today"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                {lang === "pt"
                  ? "Calendario alimentado pela TheSportsDB com ligas e competicoes de todo o mundo."
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

        <div className="mb-5 rounded-2xl border border-[#1E1E2A] bg-[#0E0E16]/80 p-4">
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
          {selectedTeam ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#14141C] p-3">
              {selectedTeam.badge ? (
                <img src={selectedTeam.badge} alt="" className="h-12 w-12 object-contain" />
              ) : null}
              <div>
                <p className="text-sm font-bold text-white">{selectedTeam.name}</p>
                <p className="text-xs text-gray-500">
                  {[selectedTeam.league, selectedTeam.country, selectedTeam.stadium].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#1E1E2A] bg-[#0E0E16]/80 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDate((current) => shiftDate(current, -1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#14141C] text-gray-300 hover:bg-[#1E1E2A]"
              aria-label={lang === "pt" ? "Dia anterior" : "Previous day"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[220px] rounded-lg border border-[#2A2A2A] bg-[#14141C] px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {lang === "pt" ? "Data selecionada" : "Selected date"}
              </p>
              <p className="text-sm font-bold text-white">{formatCalendarDate(date, locale)}</p>
            </div>
            <button
              type="button"
              onClick={() => setDate((current) => shiftDate(current, 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#14141C] text-gray-300 hover:bg-[#1E1E2A]"
              aria-label={lang === "pt" ? "Dia seguinte" : "Next day"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDate(todayDateString())}
              className="rounded-lg border border-[#E50914]/30 bg-[#E50914]/10 px-3 py-2 text-xs font-bold text-[#E50914] hover:bg-[#E50914]/20"
            >
              {lang === "pt" ? "Hoje" : "Today"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={sport}
              onChange={(event) => setSport(event.target.value)}
              className="input-dark px-3 py-2.5 text-sm"
            >
              {sports.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={leagueId}
              onChange={(event) => setLeagueId(event.target.value)}
              disabled={loadingLeagues}
              className="input-dark px-3 py-2.5 text-sm disabled:opacity-60"
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

        <div className="mb-4 flex flex-wrap gap-2">
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

        {notice ? (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {notice}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#1E1E2A] bg-[#0E0E16]/80">
          <div className="flex items-center justify-between border-b border-[#1E1E2A] px-4 py-3">
            <p className="text-sm font-bold text-white">
              {loading
                ? lang === "pt"
                  ? "A carregar calendario..."
                  : "Loading calendar..."
                : lang === "pt"
                  ? `${events.length} eventos encontrados`
                  : `${events.length} events found`}
            </p>
            <span className="text-[11px] uppercase tracking-widest text-gray-500">{source}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {lang === "pt" ? "A consultar TheSportsDB..." : "Fetching from TheSportsDB..."}
            </div>
          ) : events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#1E1E2A] text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <th className="px-4 py-3">{lang === "pt" ? "Hora" : "Time"}</th>
                    <th className="px-4 py-3">{lang === "pt" ? "Liga" : "League"}</th>
                    <th className="px-4 py-3">{lang === "pt" ? "Evento" : "Event"}</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <EventRow key={event.id} event={event} lang={locale} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500">
                {lang === "pt"
                  ? "Nenhum evento encontrado para esta data e filtro."
                  : "No events found for this date and filter."}
              </p>
              <a
                href="https://www.thesportsdb.com/browse_calendar"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#E50914] hover:underline"
              >
                {lang === "pt" ? "Ver calendario completo" : "View full calendar"}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
