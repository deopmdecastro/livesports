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
  Tv2,
  Trophy,
  Zap,
  Globe,
  Bell,
  MessageCircle,
  UserCheck,
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
    title: "Painel",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Conteúdos",
    items: [
      { label: "Lives", href: "/admin/lives", icon: Radio, badge: "AO VIVO", badgeColor: "#E50914" },
      { label: "Eventos", href: "/admin/events", icon: Calendar },
      { label: "Ligas & Competicoes", href: "/admin/competitions", icon: Trophy },
      { label: "Categorias", href: "/admin/categories", icon: Tag },
      { label: "Notícias", href: "/admin/news", icon: Newspaper },
      { label: "Banners", href: "/admin/banners", icon: Image },
    ],
  },
  {
    title: "Chat & Interação",
    items: [
      { label: "Chat das Lives", href: "/admin/chat", icon: MessageCircle, badge: "NOVO", badgeColor: "#22C55E" },
    ],
  },
  {
    title: "Criadores",
    items: [
      { label: "Criadores / Canais", href: "/admin/creators", icon: UserCheck, badge: "NOVO", badgeColor: "#3B82F6" },
    ],
  },
  {
    title: "Utilizadores",
    items: [
      { label: "Utilizadores", href: "/admin/users", icon: Users },
      { label: "Funções", href: "/admin/roles", icon: Shield },
      { label: "Permissões", href: "/admin/permissions", icon: Key },
    ],
  },
  {
    title: "Ads / Anúncios",
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiRequest<SidebarStats>("/dashboard/sidebar-stats");
        if (!cancelled) setStats(data);
      } catch {
        // ignore — keep last known values
      }
    };
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const quickStats = [
    { icon: Zap, label: "Lives", value: stats ? String(stats.livesLiveNow) : "—", color: "#E50914" },
    { icon: Users, label: "Online", value: stats ? formatCompact(stats.onlineViewers) : "—", color: "#22C55E" },
    { icon: Globe, label: "Países", value: stats ? String(stats.countries) : "—", color: "#3B82F6" },
  ];

  const toggleGroup = (title: string) => {
    setCollapsed((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="w-60 h-screen bg-[#0A0A0F] border-r border-[#1A1A24] flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-4 border-b border-[#1A1A24]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-xl p-2 shadow-[0_0_16px_rgba(229,9,20,0.35)] group-hover:shadow-[0_0_24px_rgba(229,9,20,0.5)] transition-all">
              <Tv2 className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E50914] border-2 border-[#0A0A0F] live-badge" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-white font-black text-base leading-none tracking-tight font-heading">LIVE</span>
              <span className="text-[#E50914] font-black text-base leading-none tracking-tight font-heading">SPORTS</span>
            </div>
            <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-widest leading-none mt-0.5 block">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-3 gap-px bg-[#1A1A24] border-b border-[#1A1A24]">
        {quickStats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center py-2.5 bg-[#0A0A0F] hover:bg-[#111118] transition-colors">
            <Icon className="w-3 h-3 mb-1" style={{ color }} />
            <span className="text-[11px] font-black text-white leading-none">{value}</span>
            <span className="text-[9px] text-gray-600 mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-1">
            <button
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
            >
              {group.title}
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform",
                  collapsed.includes(group.title) && "-rotate-90"
                )}
              />
            </button>

            {!collapsed.includes(group.title) && (
              <div className="space-y-0.5 mt-0.5">
                {group.items.map((item) => {
                  const isActive = item.href
                    ? pathname === item.href || pathname.startsWith(item.href + "/")
                    : false;

                  return (
                    <Link
                      key={item.label}
                      href={item.href || "#"}
                      className={cn(
                        "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-[#E50914]/15 to-transparent text-[#E50914] border-l-2 border-[#E50914] pl-[10px]"
                          : "text-gray-400 hover:text-white hover:bg-[#111118]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={cn("w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110", isActive && "text-[#E50914]")}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                          style={{
                            backgroundColor: `${item.badgeColor}20`,
                            color: item.badgeColor,
                            border: `1px solid ${item.badgeColor}30`,
                          }}
                        >
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

      {/* Footer */}
      <div className="p-3 border-t border-[#1A1A24] space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:text-blue-400 hover:bg-[#111118] rounded-lg transition-all"
        >
          <Globe className="w-4 h-4" />
          <span>Ver Site</span>
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-400 hover:bg-[#1A1A1A] rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  );
}
