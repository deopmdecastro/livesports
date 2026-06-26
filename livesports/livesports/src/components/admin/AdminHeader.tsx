"use client";

import { Bell, Search, ChevronDown, Menu, X, Radio } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface AdminHeaderProps {
  title?: string;
  onMenuToggle?: () => void;
}

export default function AdminHeader({ title = "Dashboard", onMenuToggle }: AdminHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const today = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Fetch real live count on mount and every 30s
  useEffect(() => {
    const fetchLiveCount = async () => {
      try {
        const data = await apiRequest<{ liveNow: number }>("/lives/stats");
        setLiveCount(data.liveNow ?? 0);
      } catch {
        // silently fail — keep showing last known count
      }
    };
    fetchLiveCount();
    const interval = setInterval(fetchLiveCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  const notifications = [
    { id: 1, text: "Nova live iniciada: Man. United vs Liverpool", time: "2 min atrás", unread: true, type: "live" },
    { id: 2, text: "Novo utilizador registado: carlos@example.com", time: "5 min atrás", unread: true, type: "user" },
    { id: 3, text: "Anúncio #002 atingiu o limite de impressões", time: "1h atrás", unread: false, type: "ad" },
    { id: 4, text: "Relatório mensal disponível para download", time: "3h atrás", unread: false, type: "report" },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const notifTypeColor: Record<string, string> = {
    live: "#E50914",
    user: "#22C55E",
    ad: "#F59E0B",
    report: "#3B82F6",
  };

  return (
    <header className="h-14 bg-[#0A0A0F]/95 backdrop-blur border-b border-[#1A1A24] flex items-center justify-between px-4 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A24] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-gray-600">
            <span className="text-gray-500">Admin</span>
            <span>/</span>
            <span className="text-white font-medium">{title}</span>
          </div>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-xs mx-4 hidden sm:block">
        {searchOpen ? (
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar lives, utilizadores..."
              className="w-full bg-[#111118] border border-[#2A2A38] text-white text-xs placeholder-gray-600 rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-[#E50914]/50"
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="absolute right-2 text-gray-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 bg-[#111118] border border-[#1A1A24] hover:border-[#2A2A38] text-gray-600 text-xs rounded-lg px-3 py-2 transition-colors text-left"
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Pesquisar...</span>
            <kbd className="ml-auto hidden sm:block text-[9px] bg-[#1A1A24] border border-[#2A2A38] px-1.5 py-0.5 rounded font-mono text-gray-600">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Date */}
        <span className="hidden lg:block text-[11px] text-gray-600 bg-[#111118] border border-[#1A1A24] px-3 py-1.5 rounded-lg font-medium">
          {today}
        </span>

        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E50914]/10 border border-[#E50914]/20">
          <Radio className="w-3 h-3 text-[#E50914]" />
          <span className="text-[10px] font-black text-[#E50914] uppercase tracking-wide">
            {liveCount === null ? "..." : `${liveCount} Live`}
          </span>
          {(liveCount === null || liveCount > 0) && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] live-badge flex-shrink-0" />
          )}
        </div>

        {/* Search mobile */}
        <button
          onClick={() => setSearchOpen(true)}
          className="sm:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A24] transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A24] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#E50914] rounded-full text-[9px] font-black text-white flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#111118] border border-[#1A1A24] rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-[#1A1A24] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#E50914]/15 text-[#E50914] text-[9px] font-black border border-[#E50914]/20">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#E50914] cursor-pointer hover:underline">Marcar todas como lidas</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`group flex gap-3 p-3 border-b border-[#1A1A24] hover:bg-[#1A1A24] cursor-pointer transition-colors last:border-0 ${notif.unread ? "bg-[#E50914]/3" : ""}`}
                  >
                    <div
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                      style={{ backgroundColor: notifTypeColor[notif.type] || "#666" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-200 leading-relaxed">{notif.text}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{notif.time}</p>
                    </div>
                    {notif.unread && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E50914] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
              <div className="p-2.5 text-center border-t border-[#1A1A24]">
                <Link
                  href="/admin/notifications"
                  className="text-xs text-[#E50914] hover:underline font-medium"
                  onClick={() => setNotifOpen(false)}
                >
                  Ver todas as notificações →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#1A1A24] transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-full flex items-center justify-center text-xs font-black text-white shadow-[0_0_12px_rgba(229,9,20,0.3)]">
              A
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-none">Admin</p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Super Admin</p>
            </div>
            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#111118] border border-[#1A1A24] rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-[#1A1A24]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-full flex items-center justify-center text-sm font-black text-white">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">Administrador</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">admin@livesports.com</p>
                  </div>
                </div>
              </div>
              {[
                { label: "Meu Perfil", href: "/admin/profile" },
                { label: "Configurações", href: "/admin/settings" },
                { label: "Ver Site", href: "/" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1A1A24] hover:text-white transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-[#1A1A24]">
                <Link
                  href="/login"
                  className="block px-4 py-2.5 text-sm text-red-400 hover:bg-[#1A1A24] transition-colors font-medium"
                  onClick={() => setProfileOpen(false)}
                >
                  Sair da Conta
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
