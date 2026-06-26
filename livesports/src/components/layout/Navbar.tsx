"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Menu, X, Bell, ChevronDown, Zap, Globe, Trophy, User,
  LogOut, Settings, Shield, Play, Clock, Radio, Tv2,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { cn } from "@/utils";
import { useLang } from "@/lib/lang";
import { publicApiRequest, getStoredUser, logout as performLogout } from "@/lib/api";
import type { ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface SearchResult {
  kind: "live" | "event";
  id: string;
  title: string;
  league?: string;
  leagueLogo?: string;
  teamA?: string;
  teamB?: string;
  status: string;
  sport: string;
  thumbnail?: string;
  scheduledAt?: string;
  matchTime?: string;
}

interface SearchResponse {
  lives: SearchResult[];
  events: SearchResult[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function buildTickerItems(lives: Live[]): string[] {
  const items: string[] = [];
  for (const live of lives) {
    if (live.status === "live") {
      const score =
        typeof live.scoreA === "number" && typeof live.scoreB === "number"
          ? ` ${live.scoreA}-${live.scoreB}`
          : "";
      const time = live.matchTime ? ` · ${live.matchTime}` : "";
      const teams =
        live.teamA && live.teamB
          ? `${live.teamA}${score} ${live.teamB}${time}`
          : live.title;
      items.push(`🔴 AO VIVO · ${teams}`);
    }
  }
  if (items.length === 0) {
    items.push("⚽ Copa do Mundo 2026 — EUA, Canadá e México · Junho-Julho 2026");
    items.push("🏆 FIFA World Cup 2026 — USA, Canada & Mexico · June-July 2026");
  }
  return [...items, ...items];
}

function buildNotifications(lives: Live[]) {
  const live = lives.filter((l) => l.status === "live").slice(0, 3);
  const soon = lives
    .filter((l) => l.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 2);

  const results: Array<{ title: string; time: string; dot: boolean; href: string }> = [];
  for (const l of live) {
    const label = l.teamA && l.teamB ? `${l.teamA} vs ${l.teamB} AO VIVO` : `${l.title} AO VIVO`;
    results.push({ title: label, time: "agora", dot: true, href: `/watch/${l.id}` });
  }
  for (const l of soon) {
    const diff = Math.round((new Date(l.scheduledAt).getTime() - Date.now()) / 60000);
    const label = l.teamA && l.teamB ? `${l.teamA} vs ${l.teamB}` : l.title;
    const timeStr = diff <= 0 ? "em breve" : diff < 60 ? `em ${diff}min` : `em ${Math.round(diff / 60)}h`;
    results.push({ title: `${label} começa ${timeStr}`, time: timeStr, dot: false, href: `/watch/${l.id}` });
  }
  return results;
}

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [totalViewers, setTotalViewers] = useState(0);
  const [liveItems, setLiveItems] = useState<Live[]>([]);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 320);

  useEffect(() => {
    const stored = getStoredUser<StoredUser>();
    setUser(stored);
  }, []);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const data = await publicApiRequest<ApiListResponse<Live>>("/lives?status=live&limit=50");
        const count = data.pagination?.total ?? data.items?.length ?? 0;
        setLiveCount(count);
        setLiveItems(data.items || []);
        const viewers = (data.items || []).reduce((sum, l) => sum + (l.viewerCount || 0), 0);
        setTotalViewers(viewers);
      } catch {
        setLiveCount(0);
        setLiveItems([]);
        setTotalViewers(0);
      }
    };
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    publicApiRequest<SearchResponse>(`/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`)
      .then((data) => { if (!cancelled) setSearchResults(data); })
      .catch(() => { if (!cancelled) setSearchResults(null); })
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleLogout = async () => {
    setUser(null);
    setUserMenuOpen(false);
    await performLogout();
    window.location.href = "/";
  };

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  }, []);

  const navLinks = [
    { label: t.nav_home, href: "/" },
    { label: t.nav_calendar, href: "/calendario" },
    { label: t.nav_football, href: "/futebol", hot: true },
    { label: t.nav_basketball, href: "/basquete" },
    { label: t.nav_tennis, href: "/tenis" },
    { label: t.nav_ufc, href: "/ufc" },
    { label: t.nav_f1, href: "/f1" },
  ];

  const moreLinks = [
    { label: t.nav_volleyball, href: "/volei" },
    { label: "Beisebol / Baseball", href: "/beisebol" },
    { label: "Natação / Swimming", href: "/natacao" },
    { label: "Ciclismo / Cycling", href: "/ciclismo" },
    { label: "Atletismo / Athletics", href: "/atletismo" },
  ];

  const isAdmin = user && ["super_admin", "admin", "moderator", "editor"].includes(user.role);
  const tickerItems = buildTickerItems(liveItems);

  const allSearchResults = searchResults
    ? [...searchResults.lives, ...searchResults.events]
    : [];

  return (
    <>
      {/* Live Ticker */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-7 overflow-hidden bg-[#E50914]">
        <div className="ticker-content flex items-center gap-8 py-1 px-4 text-[11px] font-bold tracking-wide text-white uppercase">
          {tickerItems.map((item, i) => (
            <span key={i} className="flex-shrink-0 flex items-center gap-3">
              {item}
              <span className="h-3 w-px bg-white/30 mx-2" />
            </span>
          ))}
        </div>
      </div>

      {/* Main Header */}
      <header
        className={cn(
          "fixed top-7 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-[#060609]/97 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.6)] border-b border-[#1E1E2A]"
            : "bg-gradient-to-b from-[#060609]/95 to-transparent"
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="relative">
                <div className="bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-lg p-1.5 neon-red transition-all group-hover:scale-105">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="live-ring absolute inline-flex h-full w-full rounded-full bg-[#E50914] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E50914]" />
                </span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="gradient-text-red font-black text-base tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>LIVE</span>
                <span className="text-white font-black text-base tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>SPORTS</span>
              </div>
            </Link>

            {/* World Cup Badge */}
            <Link
              href="/copa-do-mundo"
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/5 text-[#FFD700] text-xs font-bold hover:bg-[#FFD700]/10 transition-all neon-gold-glow mr-2"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>World Cup 2026</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors group"
                >
                  {link.label}
                  {link.hot && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="live-badge absolute inline-flex h-full w-full rounded-full bg-[#E50914] opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E50914]" />
                    </span>
                  )}
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-[#E50914] to-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
                </Link>
              ))}

              {/* More Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {t.nav_more}
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", moreOpen && "rotate-180")} />
                </button>
                {moreOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 glass border border-[#1E1E2A] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                    <div className="p-1">
                      {moreLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block px-3 py-2 text-sm text-gray-300 hover:bg-[#E50914]/10 hover:text-white rounded-lg transition-colors"
                          onClick={() => setMoreOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5">
              {/* Live count pill */}
              {liveCount > 0 && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#E50914]/10 border border-[#E50914]/20 mr-1">
                  <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#E50914]" />
                  <span className="text-[11px] font-bold text-[#E50914]">{liveCount} {t.nav_live_now}</span>
                  {totalViewers > 0 && (
                    <span className="text-[10px] text-gray-400 border-l border-[#E50914]/30 pl-2">
                      {totalViewers >= 1000 ? `${(totalViewers / 1000).toFixed(1)}K` : totalViewers} online
                    </span>
                  )}
                </div>
              )}

              {/* Search */}
              <div className="relative" ref={searchRef}>
                {searchOpen ? (
                  <div className="flex items-center gap-2 bg-[#111118] border border-[#1E1E2A] focus-within:border-[#E50914]/50 rounded-xl px-3 py-1.5 transition-all">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder={t.nav_search_placeholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-36 lg:w-52"
                      autoFocus
                    />
                    {searchLoading && (
                      <div className="w-3.5 h-3.5 border-2 border-[#E50914]/40 border-t-[#E50914] rounded-full animate-spin flex-shrink-0" />
                    )}
                    <button onClick={closeSearch}>
                      <X className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-[#111118]"
                  >
                    <Search className="w-4.5 h-4.5" />
                  </button>
                )}

                {/* Search Results Dropdown */}
                {searchOpen && searchQuery.length >= 2 && !searchLoading && allSearchResults.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-80 glass border border-[#1E1E2A] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                    <div className="p-1 max-h-[400px] overflow-y-auto">
                      {allSearchResults.map((result) => {
                        const isLive = result.status === "live";
                        const href = result.kind === "live" ? `/watch/${result.id}` : `/evento/${result.id}`;
                        const label = result.teamA && result.teamB
                          ? `${result.teamA} vs ${result.teamB}`
                          : result.title;
                        return (
                          <Link
                            key={`${result.kind}-${result.id}`}
                            href={href}
                            onClick={closeSearch}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#E50914]/8 transition-colors group"
                          >
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                              isLive ? "bg-[#E50914]/15" : "bg-white/5"
                            )}>
                              {isLive
                                ? <Radio className="w-3.5 h-3.5 text-[#E50914]" />
                                : <Clock className="w-3.5 h-3.5 text-gray-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate leading-snug group-hover:text-[#E50914] transition-colors">
                                {label}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                {result.league || result.sport}
                                {isLive && result.matchTime && ` · ${result.matchTime}`}
                              </p>
                            </div>
                            {isLive && (
                              <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#E50914] text-[9px] font-black text-white uppercase">
                                <span className="live-badge h-1 w-1 rounded-full bg-white" />
                                LIVE
                              </span>
                            )}
                            {!isLive && (
                              <Play className="w-3 h-3 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                    <div className="border-t border-[#1E1E2A] px-3 py-2">
                      <p className="text-[10px] text-gray-600 text-center">
                        {allSearchResults.length} resultado{allSearchResults.length !== 1 ? "s" : ""} para &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* No results */}
                {searchOpen && searchQuery.length >= 2 && !searchLoading && searchResults && allSearchResults.length === 0 && (
                  <div className="absolute right-0 top-full mt-2 w-72 glass border border-[#1E1E2A] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                    <div className="px-4 py-5 text-center">
                      <Search className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Nenhum resultado para &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="hidden sm:block">
                <NotificationBell userId={user?.id} />
              </div>

              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === "pt" ? "en" : "pt")}
                className="hidden sm:flex items-center gap-1.5 p-2 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-[#111118]"
                title={lang === "pt" ? "Switch to English" : "Mudar para Português"}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{lang === "pt" ? "PT" : "EN"}</span>
              </button>

              {/* Auth — logged in */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#1E1E2A] hover:border-[#E50914]/30 bg-[#111118] hover:bg-[#1A1A22] transition-all"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-white text-[10px] font-black">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-semibold text-white max-w-[80px] truncate">{user.name.split(" ")[0]}</span>
                    <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", userMenuOpen && "rotate-180")} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 glass border border-[#1E1E2A] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                      <div className="p-3 border-b border-[#1E1E2A]">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <span className="inline-flex mt-1.5 items-center gap-1 px-2 py-0.5 rounded-full bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914] text-[10px] font-bold uppercase">
                          {user.role}
                        </span>
                      </div>
                      <div className="p-1">
                        <Link href="/me" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#E50914]/10 hover:text-white rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <User className="w-4 h-4" />
                          Meu Perfil
                        </Link>
                        <Link href="/me/tickets" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#E50914]/10 hover:text-white rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Settings className="w-4 h-4" />
                          Suporte
                        </Link>
                        {user && ["creator", "editor", "moderator", "admin", "super_admin"].includes(user.role) && (
                          <Link href="/creator" className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <Tv2 className="w-4 h-4" />
                            Creator Studio
                          </Link>
                        )}
                        {isAdmin && (
                          <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#E50914]/10 hover:text-white rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <Shield className="w-4 h-4" />
                            Painel Admin
                          </Link>
                        )}
                        <div className="h-px bg-[#1E1E2A] my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:block px-4 py-2 text-sm font-semibold text-gray-200 border border-[#1E1E2A] rounded-xl hover:bg-[#111118] hover:border-[#E50914]/30 transition-all"
                  >
                    {t.nav_login}
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-[#E50914] to-[#B00000] text-white rounded-xl hover:from-[#FF1A24] hover:to-[#E50914] transition-all shadow-red"
                  >
                    {t.nav_register}
                  </Link>
                </>
              )}

              {/* Mobile toggle */}
              <button
                className="lg:hidden p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#111118] transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 top-[60px] mobile-menu-enter">
          <div className="absolute inset-0 bg-[#060609]/95 backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
          <div className="relative bg-[#060609] border-t border-[#1E1E2A] px-4 py-5 max-h-[calc(100vh-60px)] overflow-y-auto">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#111118] border border-[#1E1E2A] rounded-xl px-3 py-2.5 mb-5">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={t.nav_search_placeholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
              />
              {searchLoading && (
                <div className="w-3.5 h-3.5 border-2 border-[#E50914]/40 border-t-[#E50914] rounded-full animate-spin" />
              )}
            </div>

            {/* Mobile search results */}
            {searchQuery.length >= 2 && !searchLoading && allSearchResults.length > 0 && (
              <div className="mb-4 border border-[#1E1E2A] rounded-xl overflow-hidden">
                {allSearchResults.slice(0, 5).map((result) => {
                  const isLive = result.status === "live";
                  const href = result.kind === "live" ? `/watch/${result.id}` : `/evento/${result.id}`;
                  const label = result.teamA && result.teamB ? `${result.teamA} vs ${result.teamB}` : result.title;
                  return (
                    <Link
                      key={`${result.kind}-${result.id}`}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 border-b border-[#1E1E2A] last:border-0 hover:bg-[#111118] transition-colors"
                    >
                      {isLive
                        ? <Radio className="w-4 h-4 text-[#E50914] flex-shrink-0" />
                        : <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{label}</p>
                        <p className="text-xs text-gray-500 truncate">{result.league || result.sport}</p>
                      </div>
                      {isLive && <span className="flex-shrink-0 text-[10px] font-black text-[#E50914] uppercase">LIVE</span>}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* World Cup Banner */}
            <Link
              href="/copa-do-mundo"
              className="flex items-center gap-3 p-3 mb-4 rounded-xl border border-[#FFD700]/25 bg-gradient-to-r from-[#FFD700]/8 to-transparent"
              onClick={() => setMobileOpen(false)}
            >
              <Trophy className="w-5 h-5 text-[#FFD700]" />
              <div>
                <p className="text-sm font-bold text-[#FFD700]">FIFA World Cup 2026</p>
                <p className="text-xs text-gray-400">EUA · Canadá · México</p>
              </div>
            </Link>

            {/* User info on mobile */}
            {user && (
              <div className="flex items-center gap-3 p-3 mb-4 rounded-xl border border-[#1E1E2A] bg-[#111118]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-white font-black text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <nav className="space-y-1 mb-5">
              {[...navLinks, ...moreLinks].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#111118] rounded-xl transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user && isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[#E50914] hover:text-white hover:bg-[#111118] rounded-xl transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Painel Admin
                </Link>
              )}
            </nav>

            {/* Language + Auth */}
            <div className="border-t border-[#1E1E2A] pt-4 space-y-3">
              <button
                onClick={() => { setLang(lang === "pt" ? "en" : "pt"); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-300 border border-[#1E1E2A] rounded-xl hover:bg-[#111118] transition-colors"
              >
                <Globe className="w-4 h-4" />
                {lang === "pt" ? "Switch to English" : "Mudar para Português"}
              </button>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 text-center px-4 py-3 text-sm font-semibold text-white border border-[#1E1E2A] rounded-xl hover:bg-[#111118] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t.nav_login}
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center px-4 py-3 text-sm font-bold bg-gradient-to-r from-[#E50914] to-[#B00000] text-white rounded-xl"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t.nav_register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
