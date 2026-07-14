"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Menu, X, ChevronDown, Globe, Trophy, User, LogOut, Shield, Play, Clock, Radio, Tv2,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import BrandIdentity from "@/components/branding/BrandIdentity";
import { useLang } from "@/lib/lang";
import { publicApiRequest, getStoredUser, logout as performLogout, type ApiListResponse } from "@/lib/api";
import type { Live, StoredUser, SearchResult, SearchResponse } from "@/types";

/* ── Debounce hook ── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Constants ── */
const NAV_LINKS = [
  { href: "/", label: "Início", hot: false },
  { href: "/calendario", label: "Calendário" },
  { href: "/competicao", label: "Competições", hot: true },
  { href: "/futebol", label: "Futebol" },
  { href: "/basquete", label: "Basquete" },
];
const MORE_LINKS = [
  { href: "/tenis", label: "Ténis" },
  { href: "/ufc", label: "UFC" },
  { href: "/f1", label: "F1" },
  { href: "/blog", label: "Blog" },
];

/* ── Navbar ── */
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
  const [user, setUser] = useState<StoredUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 320);
  const isAdmin = user && ["admin", "super_admin"].includes(user.role);

  /* ── Auth ── */
  useEffect(() => { setUser(getStoredUser()); }, []);

  /* ── Live count ── */
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await publicApiRequest<ApiListResponse<Live>>("/lives?status=live&limit=50", { cacheTtl: 60_000 });
        setLiveCount(data.pagination?.total ?? data.items?.length ?? 0);
      } catch { setLiveCount(0); }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  /* ── Scroll ── */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* ── Search ── */
  useEffect(() => {
    if (debouncedQuery.length < 2) { setSearchResults(null); return; }
    setSearchLoading(true);
    publicApiRequest<SearchResponse>(`/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`)
      .then(setSearchResults)
      .catch(() => setSearchResults(null))
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

  /* ── Click outside ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Logout ── */
  const handleLogout = useCallback(async () => {
    await performLogout();
    setUser(null);
    setUserMenuOpen(false);
  }, []);

  /* ── Live ticker ── */
  const tickerItems = liveCount > 0
    ? [`🔴 ${liveCount} JOGOS AO VIVO AGORA`, "⚽ Transmissões em HD", "📱 Disponível em todos os dispositivos", "🌍 Cobertura global"]
    : ["🏆 LiveSports — A melhor plataforma de streaming desportivo", "⚽ Futebol · Basquete · Ténis · UFC · F1"];

  return (
    <>
      {/* ── Live Ticker ── */}
      <div className="fixed top-0 inset-x-0 z-[60] h-[26px] overflow-hidden bg-[#E50914]">
        <div className="ticker-track py-1 gap-10">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex-shrink-0 text-[10px] font-bold text-white/90 uppercase tracking-wider whitespace-nowrap">
              {item}
              <span className="mx-4 text-white/30">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main Header ── */}
      <header className={`fixed top-[26px] inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#030409]/95 backdrop-blur-xl border-b border-white/[0.04] shadow-lg"
          : "bg-transparent"}`}>
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <BrandIdentity mode="navbar" />
            </Link>

            {/* Competitions badge */}
            <Link href="/competicao"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/3 text-[#FFD700] text-[11px] font-bold hover:bg-[#FFD700]/8 transition-all mr-2">
              <Trophy className="w-3.5 h-3.5" /> Competições
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}
                  className="relative px-3 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors">
                  {link.label}
                  {link.hot && <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E50914] opacity-40" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E50914]" /></span>}
                </Link>
              ))}
              {/* More dropdown */}
              <div className="relative">
                <button onClick={() => setMoreOpen(!moreOpen)}
                  aria-haspopup="true" aria-expanded={moreOpen} aria-label="Mais categorias"
                  className="flex items-center gap-0.5 px-3 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors">
                  Mais <ChevronDown aria-hidden="true" className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                {moreOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 surface-raised rounded-xl shadow-xl border border-white/[0.06] py-1.5 overflow-hidden z-50">
                    {MORE_LINKS.map((l) => (
                      <Link key={l.href} href={l.href} onClick={() => setMoreOpen(false)}
                        className="block px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div ref={searchRef} className="relative hidden md:block">
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg pl-3 pr-2 py-1.5 transition-all focus-within:border-[#E50914]/30 focus-within:bg-white/[0.05]">
                  <Search aria-hidden="true" className="w-3.5 h-3.5 text-white/25" />
                  <input type="search" placeholder="Pesquisar..." aria-label="Pesquisar jogos, competições e notícias"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                    className="bg-transparent text-[13px] text-white placeholder-white/25 outline-none w-[160px] lg:w-[200px]" />
                  {searchLoading && <div className="w-3 h-3 border-2 border-[#E50914]/40 border-t-[#E50914] rounded-full animate-spin" />}
                </div>
                {searchOpen && searchResults && (
                  <div className="absolute top-full left-0 mt-2 w-full min-w-[320px] surface-raised rounded-xl shadow-2xl border border-white/[0.06] overflow-hidden z-50">
                    {[...(searchResults.lives || []), ...(searchResults.events || [])].slice(0, 5).map((r) => (
                      <Link key={`${r.kind}-${r.id}`} href={r.kind === "live" ? `/watch/${r.id}` : `/evento/${r.id}`}
                        onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                        className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0">
                        {r.status === "live" ? <Radio className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" /> : <Clock className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />}
                        <span className="text-[13px] truncate">{r.teamA && r.teamB ? `${r.teamA} vs ${r.teamB}` : r.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Live indicator */}
              {liveCount > 0 && (
                <span className="hidden lg:inline-flex items-center gap-1.5 badge-live text-[10px] px-2.5 py-1">
                  <span className="badge-live-dot" /> {liveCount}
                </span>
              )}

              {/* Language */}
              <button onClick={() => setLang(lang === "pt" ? "en" : "pt")}
                aria-label={lang === "pt" ? "Mudar idioma para inglês" : "Switch language to Portuguese"}
                className="hidden sm:flex btn btn-ghost btn-sm gap-1.5 text-white/40 hover:text-white">
                <Globe aria-hidden="true" className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase">{lang === "pt" ? "EN" : "PT"}</span>
              </button>

              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-haspopup="true" aria-expanded={userMenuOpen} aria-label={`Menu de ${user.name || "utilizador"}`}
                    className="flex items-center gap-2 btn btn-ghost btn-sm rounded-full">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-white font-bold text-xs">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 surface-raised rounded-xl shadow-2xl border border-white/[0.06] py-1.5 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/[0.04]">
                        <p className="text-sm font-semibold text-white">{user.name}</p>
                        <p className="text-[11px] text-white/30">{user.email}</p>
                      </div>
                      <Link href="/me" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"><User className="w-4 h-4" /> Meu Perfil</Link>
                      {isAdmin && (
                        <Link href="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#E50914] hover:bg-[#E50914]/5 transition-colors"><Shield className="w-4 h-4" /> Painel Admin</Link>
                      )}
                      {["creator", "editor", "moderator"].includes(user.role) && (
                        <Link href="/creator" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-yellow-400 hover:bg-yellow-500/5 transition-colors"><Tv2 className="w-4 h-4" /> Creator Studio</Link>
                      )}
                      <div className="h-px bg-white/[0.04] my-1" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-400 hover:bg-red-500/5 transition-colors"><LogOut className="w-4 h-4" /> Sair</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline-flex btn btn-ghost btn-sm text-white/60 hover:text-white">{t.nav_login}</Link>
                  <Link href="/register" className="btn btn-primary btn-sm text-xs px-4">{t.nav_register}</Link>
                </>
              )}

              {/* Mobile toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen}
                className="lg:hidden btn btn-ghost btn-icon text-white/60">
                {mobileOpen ? <X aria-hidden="true" className="w-5 h-5" /> : <Menu aria-hidden="true" className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 top-[80px]">
          <div className="absolute inset-0 bg-[#030409]/98 backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
          <div className="relative bg-[#030409] border-t border-white/[0.04] px-5 py-6 max-h-[calc(100vh-80px)] overflow-y-auto space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
              <Search aria-hidden="true" className="w-4 h-4 text-white/25 flex-shrink-0" />
              <input type="search" placeholder={t.nav_search_placeholder} aria-label={t.nav_search_placeholder} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-white/25 outline-none flex-1" />
            </div>
            {/* Links */}
            <nav className="space-y-1">
              {[...NAV_LINKS, ...MORE_LINKS].map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/50 hover:text-white rounded-lg hover:bg-white/[0.03] transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
            {/* User */}
            {user ? (
              <>
                <Link href="/me" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/[0.03]"><User className="w-4 h-4" /> Perfil</Link>
                {isAdmin && <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[#E50914] rounded-lg hover:bg-[#E50914]/5"><Shield className="w-4 h-4" /> Admin</Link>}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold text-red-400 border border-red-500/15 rounded-lg hover:bg-red-500/5"><LogOut className="w-4 h-4" /> Sair</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center py-3 text-sm font-semibold text-white/70 border border-white/[0.08] rounded-lg hover:bg-white/[0.03]">{t.nav_login}</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary py-3 text-sm">{t.nav_register}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
