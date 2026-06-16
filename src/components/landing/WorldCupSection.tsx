"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Star, Globe, ChevronRight, Zap, Calendar, MapPin } from "lucide-react";
import { useLang } from "@/lib/lang";

interface WCMatch {
  id: string;
  home_team: { name: string; code: string; flag?: string };
  away_team: { name: string; code: string; flag?: string };
  home_score?: number;
  away_score?: number;
  status: "scheduled" | "in_play" | "finished";
  datetime: string;
  stage: string;
  venue?: string;
}

interface WCTeam {
  id: string;
  name: string;
  code: string;
  flag?: string;
  group: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
}

// Mock World Cup 2026 data (real API would be football-data.org or similar)
const MOCK_WC_MATCHES: WCMatch[] = [
  {
    id: "wc1",
    home_team: { name: "Brasil", code: "BRA", flag: "🇧🇷" },
    away_team: { name: "Argentina", code: "ARG", flag: "🇦🇷" },
    status: "scheduled",
    datetime: new Date(Date.now() + 2 * 86400000).toISOString(),
    stage: "Grupo C",
    venue: "MetLife Stadium, Nova Jersey",
  },
  {
    id: "wc2",
    home_team: { name: "França", code: "FRA", flag: "🇫🇷" },
    away_team: { name: "Alemanha", code: "GER", flag: "🇩🇪" },
    status: "scheduled",
    datetime: new Date(Date.now() + 3 * 86400000).toISOString(),
    stage: "Grupo E",
    venue: "SoFi Stadium, Los Angeles",
  },
  {
    id: "wc3",
    home_team: { name: "Portugal", code: "POR", flag: "🇵🇹" },
    away_team: { name: "Espanha", code: "ESP", flag: "🇪🇸" },
    home_score: 2,
    away_score: 1,
    status: "finished",
    datetime: new Date(Date.now() - 1 * 86400000).toISOString(),
    stage: "Grupo B",
    venue: "Levi's Stadium, Santa Clara",
  },
  {
    id: "wc4",
    home_team: { name: "Inglaterra", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    away_team: { name: "Países Baixos", code: "NED", flag: "🇳🇱" },
    home_score: 1,
    away_score: 1,
    status: "in_play",
    datetime: new Date().toISOString(),
    stage: "Grupo A",
    venue: "AT&T Stadium, Dallas",
  },
  {
    id: "wc5",
    home_team: { name: "Japão", code: "JPN", flag: "🇯🇵" },
    away_team: { name: "Coreia do Sul", code: "KOR", flag: "🇰🇷" },
    status: "scheduled",
    datetime: new Date(Date.now() + 4 * 86400000).toISOString(),
    stage: "Grupo F",
    venue: "Estadio Azteca, Cidade do México",
  },
  {
    id: "wc6",
    home_team: { name: "EUA", code: "USA", flag: "🇺🇸" },
    away_team: { name: "México", code: "MEX", flag: "🇲🇽" },
    status: "scheduled",
    datetime: new Date(Date.now() + 5 * 86400000).toISOString(),
    stage: "Grupo D",
    venue: "Rose Bowl, Pasadena",
  },
];

const MOCK_WC_GROUPS: { group: string; teams: WCTeam[] }[] = [
  {
    group: "A",
    teams: [
      { id: "1", name: "Inglaterra", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "A", played: 1, wins: 0, draws: 1, losses: 0, gf: 1, ga: 1, points: 1 },
      { id: "2", name: "Países Baixos", code: "NED", flag: "🇳🇱", group: "A", played: 1, wins: 0, draws: 1, losses: 0, gf: 1, ga: 1, points: 1 },
      { id: "3", name: "Senegal", code: "SEN", flag: "🇸🇳", group: "A", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 },
      { id: "4", name: "Irã", code: "IRN", flag: "🇮🇷", group: "A", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 },
    ],
  },
  {
    group: "B",
    teams: [
      { id: "5", name: "Portugal", code: "POR", flag: "🇵🇹", group: "B", played: 1, wins: 1, draws: 0, losses: 0, gf: 2, ga: 1, points: 3 },
      { id: "6", name: "Espanha", code: "ESP", flag: "🇪🇸", group: "B", played: 1, wins: 0, draws: 0, losses: 1, gf: 1, ga: 2, points: 0 },
      { id: "7", name: "Suíça", code: "SUI", flag: "🇨🇭", group: "B", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 },
      { id: "8", name: "Uruguai", code: "URU", flag: "🇺🇾", group: "B", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 },
    ],
  },
  {
    group: "C",
    teams: [
      { id: "9", name: "Brasil", code: "BRA", flag: "🇧🇷", group: "C", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 },
      { id: "10", name: "Argentina", code: "ARG", flag: "🇦🇷", group: "C", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 },
      { id: "11", name: "Austrália", code: "AUS", flag: "🇦🇺", group: "C", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 },
      { id: "12", name: "Polónia", code: "POL", flag: "🇵🇱", group: "C", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 },
    ],
  },
];

const STATUS_COLOR = {
  scheduled: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  in_play: "text-[#E50914] bg-[#E50914]/10 border-[#E50914]/30",
  finished: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};
const STATUS_LABEL_PT = {
  scheduled: "Agendado",
  in_play: "AO VIVO",
  finished: "Encerrado",
};
const STATUS_LABEL_EN = {
  scheduled: "Scheduled",
  in_play: "LIVE",
  finished: "Finished",
};

function formatDate(iso: string, lang: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "pt" ? "pt-PT" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MatchCard({ match, lang }: { match: WCMatch; lang: string }) {
  const isLive = match.status === "in_play";
  const statusLabels = lang === "pt" ? STATUS_LABEL_PT : STATUS_LABEL_EN;

  return (
    <div className={`wc-card rounded-2xl p-4 transition-all ${isLive ? "neon-border" : ""}`}>
      {/* Stage + Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {match.stage}
        </span>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLOR[match.status]} flex items-center gap-1.5`}>
          {isLive && <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#E50914]" />}
          {statusLabels[match.status]}
        </span>
      </div>

      {/* Teams + Score */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">{match.home_team.flag}</span>
          <span className="text-xs font-bold text-white text-center leading-tight">{match.home_team.name}</span>
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          {match.status !== "scheduled" ? (
            <div className="text-3xl font-black text-white score-display">
              {match.home_score ?? 0} – {match.away_score ?? 0}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm font-black text-gray-400 mb-0.5">VS</div>
            </div>
          )}
          <span className="text-[10px] text-gray-600 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(match.datetime, lang)}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">{match.away_team.flag}</span>
          <span className="text-xs font-bold text-white text-center leading-tight">{match.away_team.name}</span>
        </div>
      </div>

      {/* Venue */}
      {match.venue && (
        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-gray-600">
          <MapPin className="h-2.5 w-2.5" />
          {match.venue}
        </div>
      )}

      {/* Watch button if live */}
      {isLive && (
        <Link
          href="/copa-do-mundo"
          className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#E50914]/15 border border-[#E50914]/30 text-[#E50914] text-xs font-bold hover:bg-[#E50914]/25 transition-all"
        >
          <Zap className="h-3.5 w-3.5" />
          {lang === "pt" ? "Assistir Agora" : "Watch Now"}
        </Link>
      )}
    </div>
  );
}

function GroupTable({ group, teams }: { group: string; teams: WCTeam[] }) {
  return (
    <div className="rounded-xl border border-[#1E1E2A] overflow-hidden bg-[#0E0E16]/80">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111118] border-b border-[#1E1E2A]">
        <Trophy className="h-3.5 w-3.5 text-[#FFD700]" />
        <span className="text-xs font-black text-white uppercase tracking-widest">Grupo {group}</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-600 uppercase tracking-widest">
            <th className="text-left px-3 py-1.5 font-semibold">País</th>
            <th className="px-2 py-1.5 font-semibold">J</th>
            <th className="px-2 py-1.5 font-semibold">V</th>
            <th className="px-2 py-1.5 font-semibold">E</th>
            <th className="px-2 py-1.5 font-semibold">D</th>
            <th className="px-2 py-1.5 font-semibold text-[#FFD700]">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => (
            <tr key={team.id} className={`border-t border-[#1E1E2A]/60 ${i < 2 ? "text-white" : "text-gray-500"}`}>
              <td className="px-3 py-2 flex items-center gap-2">
                <span>{team.flag}</span>
                <span className="font-semibold truncate max-w-[70px]">{team.name}</span>
                {i < 2 && <span className="ml-auto w-1 h-full bg-green-500 rounded-full" />}
              </td>
              <td className="px-2 py-2 text-center">{team.played}</td>
              <td className="px-2 py-2 text-center">{team.wins}</td>
              <td className="px-2 py-2 text-center">{team.draws}</td>
              <td className="px-2 py-2 text-center">{team.losses}</td>
              <td className={`px-2 py-2 text-center font-black ${i < 2 ? "text-[#FFD700]" : ""}`}>{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WorldCupSection() {
  const { lang, t } = useLang();
  const [activeTab, setActiveTab] = useState<"matches" | "groups">("matches");
  const [matches] = useState<WCMatch[]>(MOCK_WC_MATCHES);

  const tabs = [
    { id: "matches" as const, label: lang === "pt" ? "Jogos" : "Matches" },
    { id: "groups" as const, label: lang === "pt" ? "Grupos" : "Groups" },
  ];

  return (
    <section className="py-10 lg:py-16 relative overflow-hidden border-t border-[#1E1E2A]">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFD700]/3 blur-[100px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-20" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/25 flex items-center justify-center neon-gold-glow">
                <Trophy className="w-7 h-7 text-[#FFD700] trophy-glow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2
                  className="text-2xl lg:text-3xl font-black text-white"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {t.wc_title}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] text-[10px] font-black uppercase tracking-wider">
                  2026
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-[#FFD700]" />
                  {t.wc_host}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-[#FFD700]" />
                  {lang === "pt" ? "48 seleções · 104 jogos" : "48 nations · 104 matches"}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/copa-do-mundo"
            className="flex items-center gap-2 text-sm font-bold text-[#FFD700] hover:text-yellow-300 transition-colors"
          >
            {lang === "pt" ? "Ver completo" : "See all"}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[#0E0E16] border border-[#1E1E2A] rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#E50914] to-[#B00000] text-white shadow-red"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches Grid */}
        {activeTab === "matches" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} lang={lang} />
            ))}
          </div>
        )}

        {/* Groups Grid */}
        {activeTab === "groups" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_WC_GROUPS.map((g) => (
              <GroupTable key={g.group} group={g.group} teams={g.teams} />
            ))}
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-8 relative overflow-hidden rounded-2xl border border-[#FFD700]/20 bg-gradient-to-r from-[#111118] via-[#0E0E16] to-[#111118]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/5 to-transparent" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-5 lg:p-6">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🏆</span>
              <div>
                <p className="font-black text-lg text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {lang === "pt" ? "Não perca nenhum jogo da Copa do Mundo!" : "Don't miss any World Cup match!"}
                </p>
                <p className="text-sm text-gray-400">
                  {lang === "pt"
                    ? "104 jogos ao vivo · Transmissão em HD · Múltiplos servidores"
                    : "104 live matches · HD streams · Multiple servers"}
                </p>
              </div>
            </div>
            <Link
              href="/copa-do-mundo"
              className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFD700] text-black font-black text-sm hover:bg-yellow-400 transition-all neon-gold-glow"
            >
              <Zap className="h-4 w-4" />
              {t.wc_watch_live}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
