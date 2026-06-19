"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X, Bell, ChevronDown, Zap, Globe, Trophy, User, LogOut, Settings, Shield } from "lucide-react";
import { cn } from "@/utils";
import { useLang } from "@/lib/lang";
import { publicApiRequest, getStoredUser, clearAuthSession } from "@/lib/api";
import type { ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveCount, setLiveCount] = useState(0);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage
  useEffect(() => {
    const stored = getStoredUser<StoredUser>();
    setUser(stored);
  }, []);

  // Fetch live count dynamically
  useEffect(() => {
    const fetchLiveCount = async () => {
      try {
        const data = await publicApiRequest<ApiListResponse<Live>>("/lives?status=live&limit=1");
        setLiveCount(data.pagination?.total ?? data.items?.length ?? 0);
      } catch {
        setLiveCount(0);
      }
    };
    fetchLiveCount();
    const interval = setInterval(fetchLiveCount, 60_000);
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  const navLinks = [
    { label: t.nav_home, href: "/" },
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

  return (
    <>
      {/* Live Ticker */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-7 overflow-hidden bg-[#E50914]">
        <div className="ticker-content flex items-center gap-8 py-1 px-4 text-[11px] font-bold tracking-wide text-white uppercase">
          {[
            `🔴 AO VIVO · Man United 2-1 Liverpool · 75'`,
            `🔴 LIVE · Real Madrid 1-0 Barcelona · 62'`,
            `🔴 AO VIVO · Boston Celtics 78-74 Miami Heat · Q4`,
            `⚽ Copa do Mundo 2026 — EUA, Canadá e México · Junho-Julho 2026`,
            `🏆 FIFA World Cup 2026 — USA, Canada & Mexico · June-July 2026`,
            `🔴 AO VIVO · Man United 2-1 Liverpool · 75'`,
            `🔴 LIVE · Real Madrid 1-0 Barcelona · 62'`,
            `🔴 AO VIVO · Boston Celtics 78-74 Miami Heat · Q4`,
            `⚽ Copa do Mundo 2026 — EUA, Canadá e México · Junho-Julho 2026`,
            `🏆 FIFA World Cup 2026 — USA, Canada & Mexico · June-July 2026`,
          ].map((item, i) => (
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
              {/* Live count pill — dynamic */}
              {liveCount > 0 && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/10 border border-[#E50914]/20 mr-1">
                  <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#E50914]" />
                  <span className="text-[11px] font-bold text-[#E50914]">{liveCount} {t.nav_live_now}</span>
                </div>
              )}

              {/* Search */}
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
                  <button onClick={() => setSearchOpen(false)}>
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

              {/* Notifications */}
              <div className="relative hidden sm:block" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-[#111118]"
                >
                  <Bell className="w-4.5 h-4.5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E50914] rounded-full live-badge" />
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 glass border border-[#1E1E2A] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                    <div className="p-4 border-b border-[#1E1E2A]">
                      <h3 className="text-sm font-bold text-white">Notificações</h3>
                    </div>
                    <div className="p-2">
                      {[
                        { title: "Man United vs Liverpool AO VIVO", time: "agora", dot: true },
                        { title: "El Clásico começa em 30 minutos", time: "28 min", dot: false },
                        { title: "Nova transmissão: Copa Libertadores", time: "1h", dot: false },
                      ].map((n, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#111118] transition-colors cursor-pointer">
                          {n.dot && <span className="mt-1.5 h-2 w-2 rounded-full bg-[#E50914] flex-shrink-0 live-badge" />}
                          {!n.dot && <span className="mt-1.5 h-2 w-2 rounded-full bg-gray-600 flex-shrink-0" />}
                          <div>
                            <p className="text-xs font-semibold text-white leading-snug">{n.title}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-[#1E1E2A]">
                      <button className="w-full text-center text-xs text-[#E50914] font-semibold py-1.5 hover:text-red-400 transition-colors">
                        Ver todas as notificações
                      </button>
                    </div>
                  </div>
                )}
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
                        <Link href="/admin/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#E50914]/10 hover:text-white rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <User className="w-4 h-4" />
                          Meu Perfil
                        </Link>
                        {isAdmin && (
                          <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#E50914]/10 hover:text-white rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <Shield className="w-4 h-4" />
                            Painel Admin
                          </Link>
                        )}
                        <Link href="/admin/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#E50914]/10 hover:text-white rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Settings className="w-4 h-4" />
                          Configurações
                        </Link>
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
                className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
              />
            </div>

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
