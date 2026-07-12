"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Calendar,
  Tag,
  Newspaper,
  Image,
  Users,
  Shield,
  Key,
  Megaphone,
  MapPin,
  BarChart3,
  Settings,
  ScrollText,
  HeadphonesIcon,
  LogOut,
  ChevronDown,
  Trophy,
  Zap,
  Globe,
  Bell,
  MessageCircle,
  UserCheck,
  Tv2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { formatCompact } from "@/hooks/usePlatformStats";

interface SidebarStats {
  livesLiveNow: number;
  onlineViewers: number;
  countries: number;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Lives", href: "/admin/lives", icon: Radio, badge: "AO VIVO", badgeColor: "#E50914" },
      { label: "Eventos", href: "/admin/events", icon: Calendar },
      { label: "Competições", href: "/admin/competitions", icon: Trophy },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { label: "Categorias", href: "/admin/categories", icon: Tag },
      { label: "Notícias", href: "/admin/news", icon: Newspaper },
      { label: "Banners", href: "/admin/banners", icon: Image },
      { label: "Chat das Lives", href: "/admin/chat", icon: MessageCircle, badge: "NOVO", badgeColor: "#22C55E" },
    ],
  },
  {
    title: "Criadores & Utilizadores",
    items: [
      { label: "Criadores", href: "/admin/creators", icon: UserCheck, badge: "NOVO", badgeColor: "#E50914" },
      { label: "Utilizadores", href: "/admin/users", icon: Users },
      { label: "Funções", href: "/admin/roles", icon: Shield },
      { label: "Permissões", href: "/admin/permissions", icon: Key },
    ],
  },
  {
    title: "Publicidade",
    items: [
      { label: "Gerenciar Ads", href: "/admin/ads", icon: Megaphone },
      { label: "Campanhas", href: "/admin/campaigns", icon: Zap, badge: "NOVO", badgeColor: "#F59E0B" },
      { label: "Posições", href: "/admin/ads/positions", icon: MapPin },
      { label: "Relatórios", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Configurações", href: "/admin/settings", icon: Settings },
      { label: "Perfil Admin", href: "/admin/profile", icon: UserCheck, badge: "NOVO", badgeColor: "#E50914" },
      { label: "API Keys", href: "/admin/api-keys", icon: Key },
      { label: "Notificações", href: "/admin/notifications", icon: Bell },
      { label: "Logs", href: "/admin/logs", icon: ScrollText },
      { label: "Suporte", href: "/admin/support", icon: HeadphonesIcon },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [stats, setStats] = useState<SidebarStats | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiRequest<SidebarStats>("/dashboard/sidebar-stats");
        if (!cancelled) setStats(data);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const quickStats = [
    { icon: Radio, label: "Ao Vivo", value: stats ? String(stats.livesLiveNow) : "—", color: "#E50914" },
    { icon: Users, label: "Online", value: stats ? formatCompact(stats.onlineViewers) : "—", color: "#22C55E" },
    { icon: Globe, label: "Países", value: stats ? String(stats.countries) : "—", color: "#3B82F6" },
  ];

  const toggleGroup = (title: string) => {
    setCollapsed((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // Check if any item in a group is active (for auto-expand)
  const isGroupActive = (group: typeof navGroups[0]) =>
    group.items.some((item) => item.href && (pathname === item.href || pathname.startsWith(item.href + "/")));

  return (
    <aside className="w-60 h-screen bg-[#06060C] border-r border-[#0E0E16] flex flex-col overflow-hidden relative">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="relative p-4 border-b border-[#0E0E16] bg-gradient-to-b from-[#0A0A12] to-[#06060C]">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E50914] to-[#800000] rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(229,9,20,0.2)] group-hover:shadow-[0_6px_24px_rgba(229,9,20,0.3)] transition-shadow">
              <Tv2 className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#06060C] shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          </div>
          <div className="min-w-0">
            <span className="text-[#E50914] font-black text-xs leading-none block">LIVE</span>
            <span className="text-white font-black text-xs leading-none block">SPORTS</span>
            <span className="text-[9px] text-gray-600 font-medium">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 mx-3 mt-3 rounded-xl overflow-hidden border border-[#0E0E16] bg-[#09090F]">
        {quickStats.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center py-3 hover:bg-[#0D0D15] transition-colors relative group cursor-default"
          >
            <Icon className="w-3.5 h-3.5 mb-1" style={{ color }} />
            <span className="text-[13px] font-black text-white leading-none">{value}</span>
            <span className="text-[9px] text-gray-500 mt-0.5 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
        {navGroups.map((group) => {
          const active = isGroupActive(group);
          const isCollapsed = collapsed.includes(group.title);

          return (
            <div key={group.title} className="mb-0.5">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.title)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all group/header",
                  active ? "text-red-400/80" : "text-gray-600 hover:text-gray-400"
                )}
              >
                <span className="flex-1 text-left">{group.title}</span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    isCollapsed && "-rotate-90"
                  )}
                />
              </button>

              {/* Items */}
              <div
                className={cn(
                  "grid transition-all duration-200 ease-in-out",
                  isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-0.5 pt-0.5 pb-1">
                    {group.items.map((item) => {
                      const isActive = item.href
                        ? pathname === item.href || pathname.startsWith(item.href + "/")
                        : false;
                      const isHovered = hoveredItem === item.label;

                      return (
                        <Link
                          key={item.label}
                          href={item.href || "#"}
                          onMouseEnter={() => setHoveredItem(item.label)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={cn(
                            "group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-red-500/10 text-red-400"
                              : "text-gray-400 hover:text-white hover:bg-[#0D0D15]"
                          )}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[#E50914] to-[#B00000] shadow-[0_0_8px_rgba(229,9,20,0.4)]" />
                          )}

                          {/* Icon */}
                          <div
                            className={cn(
                              "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 flex-shrink-0",
                              isActive
                                ? "bg-red-500/15 text-red-400"
                                : isHovered
                                  ? "bg-white/5 text-gray-300"
                                  : "text-gray-500"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "w-3.5 h-3.5 transition-transform duration-200",
                                isHovered && !isActive && "scale-110",
                                isActive && "scale-100"
                              )}
                            />
                          </div>

                          {/* Label + badge */}
                          <span className="flex-1 truncate">{item.label}</span>

                          {item.badge && (
                            <span
                              className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                              style={{
                                backgroundColor: `${item.badgeColor}18`,
                                color: item.badgeColor,
                                border: `1px solid ${item.badgeColor}30`,
                              }}
                            >
                              {item.badge}
                            </span>
                          )}

                          {/* Hover arrow */}
                          {!isActive && isHovered && (
                            <ChevronRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative p-3 border-t border-[#0E0E16] bg-gradient-to-t from-[#08080E] to-transparent">
        <div className="space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.03] group-hover:bg-red-500/10 transition-colors">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <span className="flex-1">Ver Site</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.03] group-hover:bg-red-500/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <span className="flex-1">Sair</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
          </Link>
        </div>
      </div>
    </aside>
  );
}