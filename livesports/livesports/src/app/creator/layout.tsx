"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Radio, BarChart3, HeadphonesIcon,
  Tv2, Globe, LogOut, ChevronDown, Users, PlayCircle,
  TrendingUp, MessageSquare, Bell, Settings,
} from "lucide-react";
import { cn } from "@/utils";

const navGroups = [
  {
    title: "Painel",
    items: [
      { label: "Dashboard", href: "/creator", icon: LayoutDashboard },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { label: "Minhas Lives", href: "/creator/lives", icon: Radio, badge: "LIVE", badgeColor: "#E50914" },
      { label: "Canais", href: "/creator/channels", icon: PlayCircle },
      { label: "Audiência", href: "/creator/analytics", icon: TrendingUp },
    ],
  },
  {
    title: "Comunidade",
    items: [
      { label: "Chat & Mensagens", href: "/creator/chat", icon: MessageSquare },
      { label: "Notificações", href: "/creator/notifications", icon: Bell },
    ],
  },
  {
    title: "Suporte",
    items: [
      { label: "Tickets", href: "/creator/support", icon: HeadphonesIcon },
      { label: "Definições", href: "/creator/settings", icon: Settings },
    ],
  },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const toggleGroup = (title: string) => {
    setCollapsed((prev) => prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      <aside className="hidden lg:flex w-60 h-screen bg-[#0A0A0F] border-r border-[#1A1A24] flex-col overflow-hidden">
        <div className="p-4 border-b border-[#1A1A24]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl p-2 shadow-[0_0_16px_rgba(124,58,237,0.35)] group-hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] transition-all">
              <Tv2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-white font-black text-base leading-none tracking-tight">LIVE</span>
                <span className="text-violet-400 font-black text-base leading-none tracking-tight">SPORTS</span>
              </div>
              <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-widest leading-none mt-0.5 block">
                Criador
              </span>
            </div>
          </Link>
        </div>

        <div className="px-4 py-3 border-b border-[#1A1A24]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-black text-sm">
              C
            </div>
            <div>
              <p className="text-xs font-bold text-white">Criador</p>
              <p className="text-[10px] text-violet-400">Conta Pro</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
              >
                {group.title}
                <ChevronDown className={cn("w-3 h-3 transition-transform", collapsed.includes(group.title) && "-rotate-90")} />
              </button>
              {!collapsed.includes(group.title) && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                          isActive
                            ? "bg-gradient-to-r from-violet-500/15 to-transparent text-violet-400 border-l-2 border-violet-500 pl-[10px]"
                            : "text-gray-400 hover:text-white hover:bg-[#111118]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-violet-400")} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {"badge" in item && item.badge && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                            style={{ backgroundColor: `${item.badgeColor}20`, color: item.badgeColor, border: `1px solid ${item.badgeColor}30` }}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1A1A24] space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:text-blue-400 hover:bg-[#111118] rounded-lg transition-all">
            <Globe className="w-4 h-4" /><span>Ver Site</span>
          </Link>
          <Link href="/login" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-400 hover:bg-[#1A1A1A] rounded-lg transition-all">
            <LogOut className="w-4 h-4" /><span>Sair</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#1A1A24] bg-[#0A0A0F]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-300">Painel do Criador</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/creator/support/new" className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
              <HeadphonesIcon className="w-3.5 h-3.5" /> Suporte
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
