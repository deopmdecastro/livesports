"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Clock,
  Globe,
  LogOut,
  Menu,
  Radio,
  Search,
  Shield,
  Trophy,
  Tv2,
  User,
  X,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import BrandIdentity from "@/components/branding/BrandIdentity";
import { useLang } from "@/lib/lang";
import {
  publicApiRequest,
  getStoredUser,
  logout as performLogout,
  type ApiListResponse,
} from "@/lib/api";
import type { Live, StoredUser, SearchResponse } from "@/types";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

const NAV_LINKS = [
  { href: "/", label: "Início", hot: false },
  { href: "/calendario", label: "Calendário" },
  { href: "/competicao", label: "Competições", hot: true },
  { href: "/futebol", label: "Futebol" },
  { href: "/basquete", label: "Basquete" },
];

const MORE_LINKS = [
  { href: "/tenis", label: "Tênis" },
  { href: "/ufc", label: "UFC" },
  { href: "/f1", label: "F1" },
  { href: "/blog", label: "Blog" },
];

export default function Navbar() {
  const pathname = usePathname();
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

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await publicApiRequest<ApiListResponse<Live>>("/lives?status=live&limit=50", {
          cacheTtl: 60_000,
        });
        setLiveCount(data.pagination?.total ?? data.items?.length ?? 0);
      } catch {
        setLiveCount(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    publicApiRequest<SearchResponse>(`/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`)
      .then(setSearchResults)
      .catch(() => setSearchResults(null))
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleLogout = useCallback(async () => {
    await performLogout();
    setUser(null);
    setUserMenuOpen(false);
  }, []);

  const tickerItems = liveCount > 0
    ? [
        `${liveCount} jogos ao vivo agora`,
        "Placar instantâneo e estatísticas em tempo real",
        "Streaming premium para todos os dispositivos",
        "Competições globais com cobertura contínua",
      ]
    : [
        "LiveSports — a melhor plataforma de streaming desportivo",
        "Futebol, Basquete, Tênis, UFC e F1 com experiência premium",
      ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[70] h-[26px] overflow-hidden border-b border-white/5 bg-[#c80812]">
        <div className="ticker-track h-full items-center gap-12 px-4">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.18em] text-white/92"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-white" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <header className="fixed inset-x-0 top-[26px] z-[65] px-3 pt-3 lg:px-5">
        <div
          className={`mx-auto max-w-[1400px] rounded-[24px] border transition-all duration-300 ${
            scrolled
              ? "border-white/10 bg-[rgba(7,8,13,0.88)] shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
              : "border-white/8 bg-[rgba(7,8,13,0.72)] backdrop-blur-xl"
          }`}
        >
          <div className="flex h-[62px] items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-3 lg:gap-4">
              <Link href="/" className="shrink-0">
                <BrandIdentity mode="navbar" />
              </Link>

              <Link
                href="/competicao"
                className="hidden xl:inline-flex items-center gap-2 rounded-full border border-[#ffd56a]/18 bg-[#ffd56a]/[0.06] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffd56a] transition-colors hover:bg-[#ffd56a]/[0.1]"
              >
                <Trophy className="h-3.5 w-3.5" />
                Competições
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${
                      isActive(link.href) ? "text-white" : "text-white/56 hover:text-white"
                    }`}
                  >
                    {link.label}
                    {isActive(link.href) ? (
                      <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-gradient-to-r from-[#E50914] to-[#ff6b73]" />
                    ) : null}
                    {link.hot ? (
                      <span className="absolute -right-0.5 top-1 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E50914] opacity-45" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E50914]" />
                      </span>
                    ) : null}
                  </Link>
                ))}

                <div className="relative">
                  <button
                    onClick={() => setMoreOpen((value) => !value)}
                    aria-haspopup="true"
                    aria-expanded={moreOpen}
                    className="flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-semibold text-white/56 transition-colors hover:text-white"
                  >
                    Mais
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                  </button>

                  {moreOpen ? (
                    <div className="absolute left-0 top-full mt-3 w-48 overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(11,12,18,0.94)] p-2 shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                      {MORE_LINKS.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreOpen(false)}
                          className="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div ref={searchRef} className="relative hidden md:block">
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-black/25 pl-4 pr-3 py-2 transition-all focus-within:border-white/16 focus-within:bg-white/[0.04]">
                  <Search className="h-3.5 w-3.5 text-white/28" />
                  <input
                    type="search"
                    placeholder="Pesquisar..."
                    aria-label="Pesquisar jogos, competições e notícias"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setSearchOpen(true);
                    }}
                    className="w-[150px] bg-transparent text-[13px] text-white placeholder-white/25 outline-none lg:w-[210px]"
                  />
                  {searchLoading ? <div className="h-3 w-3 rounded-full border-2 border-[#E50914]/30 border-t-[#E50914] animate-spin" /> : null}
                </div>

                {searchOpen && searchResults ? (
                  <div className="absolute left-0 top-full mt-3 min-w-[320px] overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(11,12,18,0.94)] shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                    {[...(searchResults.lives || []), ...(searchResults.events || [])].slice(0, 5).map((result) => (
                      <Link
                        key={`${result.kind}-${result.id}`}
                        href={result.kind === "live" ? `/watch/${result.id}` : `/evento/${result.id}`}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3 text-white/64 transition-colors last:border-b-0 hover:bg-white/[0.04] hover:text-white"
                      >
                        {result.status === "live" ? (
                          <Radio className="h-3.5 w-3.5 shrink-0 text-[#E50914]" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 shrink-0 text-white/25" />
                        )}
                        <span className="truncate text-[13px]">
                          {result.teamA && result.teamB ? `${result.teamA} vs ${result.teamB}` : result.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              {liveCount > 0 ? (
                <span className="hidden lg:inline-flex items-center gap-2 rounded-full border border-[#E50914]/25 bg-[#E50914]/14 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6169]">
                  <span className="badge-live-dot" />
                  {liveCount}
                </span>
              ) : null}

              <button
                onClick={() => setLang(lang === "pt" ? "en" : "pt")}
                aria-label={lang === "pt" ? "Mudar idioma para inglês" : "Switch language to Portuguese"}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-white"
              >
                <Globe className="h-3.5 w-3.5" />
                {lang === "pt" ? "EN" : "PT"}
              </button>

              <NotificationBell />

              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen((value) => !value)}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                    aria-label={`Menu de ${user.name || "utilizador"}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff2733] to-[#af000d] text-sm font-black text-white shadow-[0_0_18px_rgba(229,9,20,0.28)]"
                  >
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </button>

                  {userMenuOpen ? (
                    <div className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(11,12,18,0.94)] py-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                      <div className="border-b border-white/[0.05] px-4 py-3">
                        <p className="text-sm font-semibold text-white">{user.name}</p>
                        <p className="text-[11px] text-white/30">{user.email}</p>
                      </div>
                      <Link href="/me" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-white/62 transition-colors hover:bg-white/[0.04] hover:text-white">
                        <User className="h-4 w-4" />
                        Meu Perfil
                      </Link>
                      {isAdmin ? (
                        <Link href="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#ff6770] transition-colors hover:bg-[#E50914]/8">
                          <Shield className="h-4 w-4" />
                          Painel Admin
                        </Link>
                      ) : null}
                      {["creator", "editor", "moderator"].includes(user.role) ? (
                        <Link href="/creator" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#ffd56a] transition-colors hover:bg-[#ffd56a]/8">
                          <Tv2 className="h-4 w-4" />
                          Creator Studio
                        </Link>
                      ) : null}
                      <div className="my-1 h-px bg-white/[0.05]" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-400 transition-colors hover:bg-red-500/8">
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline-flex rounded-full px-3 py-2 text-[13px] font-semibold text-white/64 transition-colors hover:text-white">
                    {t.nav_login}
                  </Link>
                  <Link href="/register" className="btn btn-primary btn-sm rounded-full px-4 text-[11px] uppercase tracking-[0.16em]">
                    {t.nav_register}
                  </Link>
                </>
              )}

              <button
                onClick={() => setMobileOpen((value) => !value)}
                aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={mobileOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white/68 transition-colors hover:text-white lg:hidden"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] top-[92px] lg:hidden">
          <div className="absolute inset-0 bg-[rgba(5,6,10,0.92)] backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
          <div className="relative mx-3 overflow-hidden rounded-[24px] border border-white/8 bg-[rgba(9,10,15,0.96)] p-4 shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-center gap-2 rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
              <Search className="h-4 w-4 text-white/28" />
              <input
                type="search"
                placeholder={t.nav_search_placeholder}
                aria-label={t.nav_search_placeholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
              />
            </div>

            <nav className="space-y-1">
              {[...NAV_LINKS, ...MORE_LINKS].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                    isActive(link.href) ? "bg-white/[0.05] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive(link.href) ? <span className="h-2 w-2 rounded-full bg-[#E50914]" /> : null}
                </Link>
              ))}
            </nav>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {user ? (
                <>
                  <Link href="/me" onClick={() => setMobileOpen(false)} className="rounded-2xl border border-white/8 px-3 py-3 text-center text-sm font-semibold text-white/70">
                    Perfil
                  </Link>
                  <button onClick={handleLogout} className="rounded-2xl border border-red-500/20 px-3 py-3 text-sm font-semibold text-red-400">
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-2xl border border-white/8 px-3 py-3 text-center text-sm font-semibold text-white/70">
                    {t.nav_login}
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary rounded-2xl py-3 text-sm">
                    {t.nav_register}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
