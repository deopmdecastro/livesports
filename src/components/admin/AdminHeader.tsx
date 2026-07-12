"use client";

import { Bell, Search, ChevronDown, Menu, X, Radio, Check, CheckCheck, Trash2, Ticket, BarChart2, Tv, AlertCircle, Info } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/utils";
import { apiRequest } from "@/lib/api";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { getSocket } from "@/lib/socket";

/* ── Notification type config ── */
const NOTIF_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  new_ticket:           { icon: Ticket,       color: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
  ticket_reply:         { icon: Ticket,       color: 'text-red-400',     bg: 'bg-red-500/10'   },
  ticket_status_change: { icon: Ticket,       color: 'text-green-400',   bg: 'bg-green-500/10'  },
  poll_milestone:       { icon: BarChart2,    color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  creator_application:  { icon: Tv,           color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  channel_status_change:{ icon: Tv,           color: 'text-red-400',     bg: 'bg-red-500/10'    },
  system:               { icon: Info,         color: 'text-gray-400',    bg: 'bg-gray-500/10'   },
  live:                 { icon: Radio,        color: 'text-red-400',     bg: 'bg-red-500/10'    },
  info:                 { icon: Info,         color: 'text-sky-400',     bg: 'bg-sky-500/10'    },
  success:              { icon: Check,        color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  warning:              { icon: AlertCircle,  color: 'text-amber-400',   bg: 'bg-amber-500/10'  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora mesmo';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

/* ── Notification item component ── */
function AdminNotifItem({
  notif,
  onRead,
  onDelete,
  onClose,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const cfg = NOTIF_TYPE_CONFIG[notif.type] || NOTIF_TYPE_CONFIG.system;
  const Icon = cfg.icon;

  const content = (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer',
        notif.read ? 'hover:bg-white/[0.02]' : 'bg-[#E50914]/[0.03] hover:bg-[#E50914]/[0.06]',
      )}
    >
      <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
        <Icon className={cn('h-4 w-4', cfg.color)} />
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', notif.read ? 'text-gray-300' : 'font-semibold text-white')}>
          {notif.title}
        </p>
        {notif.message && (
          <p className="mt-0.5 truncate text-[11px] text-gray-500">{notif.message}</p>
        )}
        <p className="mt-1 text-[10px] text-gray-600">{timeAgo(notif.createdAt)}</p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead(notif.id); }}
            title="Marcar como lida"
            className="rounded p-1 text-gray-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(notif.id); }}
          title="Eliminar"
          className="rounded p-1 text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {!notif.read && (
          <span className="ml-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#E50914]" />
        )}
      </div>
    </div>
  );

  if (notif.link) {
    return (
      <Link href={notif.link} onClick={() => { onRead(notif.id); onClose(); }} className="block">
        {content}
      </Link>
    );
  }
  return <div onClick={() => !notif.read && onRead(notif.id)}>{content}</div>;
}

/* ── AdminHeader Component ── */
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
  const [userName, setUserName] = useState("Admin");
  const [userEmail, setUserEmail] = useState("admin@livesports.com");
  const searchRef = useRef<HTMLInputElement>(null);

  // Real notifications via hook
  // NOTE: currentUserId and today are derived from browser-only APIs
  // (localStorage / Date formatting that can differ between server & client
  // locale/timezone). Computing them directly during render caused a
  // server/client HTML mismatch (React error #418). They're now set in
  // useEffect so the very first client render matches the server render,
  // and the real values are applied right after mount.
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [today, setToday] = useState("");

  useEffect(() => {
    try {
      const token = localStorage.getItem('livesports.accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub || payload.userId);
      }
    } catch {}

    setToday(
      new Date().toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    markAsRead,
    markAllRead,
    deleteNotification,
  } = useNotifications(currentUserId);

  // Fetch live count
  useEffect(() => {
    const fetchLiveCount = async () => {
      try {
        const data = await apiRequest<{ liveNow?: number; items?: unknown[] }>("/lives/stats", { cacheTtl: 25_000 });
        setLiveCount(data.liveNow ?? (Array.isArray(data.items) ? data.items.length : 0) ?? 0);
      } catch { /* silently fail */ }
    };
    fetchLiveCount();
    const interval = setInterval(fetchLiveCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Load admin profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // GET /auth/me returns the user object directly (not wrapped in `user`).
        const data = await apiRequest<{ name?: string; email?: string }>("/auth/me", { cacheTtl: 60_000 });
        if (data.name) setUserName(data.name);
        if (data.email) setUserEmail(data.email);
      } catch { /* fall back to defaults */ }
    };
    loadProfile();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notif-dropdown]')) setNotifOpen(false);
      if (!target.closest('[data-profile-dropdown]')) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Get initials for avatar
  const initials = userName.split(' ').map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase();

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
            <kbd className="ml-auto hidden sm:block text-[9px] bg-[#1A1A24] border border-[#2A2A38] px-1.5 py-0.5 rounded font-mono text-gray-600">⌘K</kbd>
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

        {/* Notifications — REAL DATA */}
        <div className="relative" data-notif-dropdown>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A24] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-[#E50914] rounded-full text-[9px] font-black text-white flex items-center justify-center px-1 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#111118] border border-[#1A1A24] rounded-2xl shadow-2xl overflow-hidden z-50">
              {/* Header */}
              <div className="p-3 border-b border-[#1A1A24] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#E50914]" />
                  <span className="text-sm font-bold text-white">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#E50914]/20 px-1.5 py-0.5 text-[9px] font-black text-[#E50914]">
                      {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-400 hover:bg-[#1A1A2A] hover:text-emerald-400 transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Todas lidas
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[#1A1A24]">
                {notifLoading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E50914] border-t-transparent" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-600">
                    <Bell className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Sem notificações</p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <AdminNotifItem
                      key={n.id}
                      notif={n}
                      onRead={markAsRead}
                      onDelete={deleteNotification}
                      onClose={() => setNotifOpen(false)}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              <Link
                href="/admin/notifications"
                className="block p-2.5 text-center text-xs text-[#E50914] hover:bg-[#1A1A24] hover:underline font-medium border-t border-[#1A1A24] transition-colors"
                onClick={() => setNotifOpen(false)}
              >
                Ver todas as notificações →
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" data-profile-dropdown>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#1A1A24] transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-full flex items-center justify-center text-xs font-black text-white shadow-[0_0_12px_rgba(229,9,20,0.3)]">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{userName}</p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Super Admin</p>
            </div>
            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#111118] border border-[#1A1A24] rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-[#1A1A24]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-full flex items-center justify-center text-sm font-black text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">{userName}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{userEmail}</p>
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