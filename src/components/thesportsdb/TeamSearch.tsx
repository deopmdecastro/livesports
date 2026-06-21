"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Shield } from "lucide-react";
import { searchSportsTeams, type SportsTeamSearchResult } from "@/lib/thesportsdb";

interface TeamSearchProps {
  label?: string;
  placeholder?: string;
  onSelect?: (team: SportsTeamSearchResult) => void;
  disabled?: boolean;
  hint?: string;
  className?: string;
}

export function TeamSearch({
  label = "Pesquisar equipa",
  placeholder = "Ex: Arsenal, Benfica, Real Madrid...",
  onSelect,
  disabled = false,
  hint,
  className = "",
}: TeamSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SportsTeamSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setNotice(null);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      searchSportsTeams(query)
        .then((data) => {
          setResults(data.teams);
          setNotice(data.notice || null);
          setOpen(true);
        })
        .catch(() => {
          setResults([]);
          setNotice("Nao foi possivel pesquisar equipas.");
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (team: SportsTeamSearchResult) => {
    onSelect?.(team);
    setQuery(team.name);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {label ? <label className="block text-xs font-medium text-gray-300">{label}</label> : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input-dark w-full py-2.5 pl-9 pr-10 text-sm"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500" />
        ) : null}
      </div>
      {hint ? <p className="text-[10px] text-gray-500">{hint}</p> : null}
      {notice ? <p className="text-[10px] text-amber-400">{notice}</p> : null}

      {open && results.length > 0 ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#2A2A2A] bg-[#14141C] shadow-xl">
          {results.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => handleSelect(team)}
              className="flex w-full items-center gap-3 border-b border-[#2A2A2A]/80 px-3 py-2.5 text-left last:border-0 hover:bg-white/[0.04]"
            >
              {team.badge ? (
                <img src={team.badge} alt="" className="h-8 w-8 object-contain" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A2A2A]">
                  <Shield className="h-4 w-4 text-gray-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{team.name}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {[team.league, team.country].filter(Boolean).join(" · ")}
                </p>
              </div>
              {team.shortName ? (
                <span className="rounded bg-[#2A2A2A] px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                  {team.shortName}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {open && !loading && query.trim().length >= 2 && results.length === 0 ? (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-[#2A2A2A] bg-[#14141C] px-3 py-3 text-xs text-gray-500">
          Nenhuma equipa encontrada.
        </div>
      ) : null}
    </div>
  );
}

interface AdminTeamSearchFieldProps {
  label: string;
  onApply: (team: SportsTeamSearchResult) => void;
  disabled?: boolean;
}

export function AdminTeamSearchField({ label, onApply, disabled = false }: AdminTeamSearchFieldProps) {
  return (
    <TeamSearch
      label={label}
      disabled={disabled}
      hint='Chave free: teste "Arsenal". Premium desbloqueia pesquisa completa.'
      onSelect={onApply}
    />
  );
}
