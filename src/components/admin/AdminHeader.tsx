"use client";

import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface AdminHeaderProps {
  title?: string;
  onMenuToggle?: () => void;
}

export default function AdminHeader({ title = "Dashboard", onMenuToggle }: AdminHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dateRange] = useState("01/05/2024 - 31/05/2024");

  const notifications = [
    { id: 1, text: "Nova live iniciada: Man. United vs Liverpool", time: "2 min atrás", unread: true },
    { id: 2, text: "Novo utilizador registado: carlos@example.com", time: "5 min atrás", unread: true },
    { id: 3, text: "Anúncio #002 atingiu o limite de impressões", time: "1h atrás", unread: false },
    { id: 4, text: "Relatório mensal disponível para download", time: "3h atrás", unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-14 bg-[#0F0F0F] border-b border-[#1A1A1A] flex items-center justify-between px-4 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A1A]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-white">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Date Range */}
        <span className="hidden md:block text-xs text-gray-400 bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 rounded-lg">
          {dateRange}
        </span>

        {/* Search */}
        <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A1A] transition-colors hidden sm:block">
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#E50914] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-[#2A2A2A] flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Notificações</span>
                <span className="text-xs text-[#E50914] cursor-pointer hover:underline">Marcar todas como lidas</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b border-[#2A2A2A] hover:bg-[#2A2A2A] cursor-pointer transition-colors ${
                      notif.unread ? "bg-[#E50914]/5" : ""
                    }`}
                  >
                    <p className="text-xs text-gray-200 leading-relaxed">{notif.text}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 text-center">
                <Link href="/admin/notifications" className="text-xs text-[#E50914] hover:underline" onClick={() => setNotifOpen(false)}>
                  Ver todas as notificações
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="w-7 h-7 bg-[#E50914] rounded-full flex items-center justify-center text-xs font-bold">A</div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-none">Administrador</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">admin@livesports.com</p>
            </div>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-[#2A2A2A]">
                <p className="text-xs font-semibold text-white">Administrador</p>
                <p className="text-xs text-gray-400">admin@livesports.com</p>
              </div>
              {[
                { label: "Perfil", href: "/admin/profile" },
                { label: "Configurações", href: "/admin/settings" },
                { label: "Ver Site", href: "/" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block px-3 py-2 text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-[#2A2A2A]">
                <Link
                  href="/login"
                  className="block px-3 py-2 text-sm text-red-400 hover:bg-[#2A2A2A] transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  Sair
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
