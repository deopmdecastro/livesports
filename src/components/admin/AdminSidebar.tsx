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
} from "lucide-react";
import { cn } from "@/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
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
      { label: "Lives", href: "/admin/lives", icon: Radio },
      { label: "Eventos", href: "/admin/events", icon: Calendar },
      { label: "Categorias", href: "/admin/categories", icon: Tag },
      { label: "Notícias", href: "/admin/news", icon: Newspaper },
      { label: "Banners", href: "/admin/banners", icon: Image },
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
      { label: "Posições", href: "/admin/ads/positions", icon: MapPin },
      { label: "Relatórios", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Configurações", href: "/admin/settings", icon: Settings },
      { label: "Logs", href: "/admin/logs", icon: ScrollText },
      { label: "Suporte", href: "/admin/support", icon: HeadphonesIcon },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const toggleGroup = (title: string) => {
    setCollapsed((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="w-60 min-h-screen bg-[#0F0F0F] border-r border-[#1A1A1A] flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-[#1A1A1A]">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-[#E50914] rounded p-1">
            <Tv2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[#E50914] font-black text-sm leading-none block font-heading">LIVE</span>
            <span className="text-white font-black text-sm leading-none block font-heading">SPORTS</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-1">
            <button
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-400 transition-colors"
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
                        "sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                        isActive
                          ? "bg-[#E50914]/15 text-[#E50914] border-l-[#E50914]"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[#1A1A1A]">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-[#1A1A1A] rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  );
}
