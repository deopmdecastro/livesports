"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Heart, Clock, HeadphonesIcon, Settings,
  Tv2, Home, Bell, User,
} from "lucide-react";
import { cn } from "@/utils";

const navItems = [
  { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
  { label: "Favoritos", href: "/user/favorites", icon: Heart },
  { label: "Histórico", href: "/user/history", icon: Clock },
  { label: "Notificações", href: "/user/notifications", icon: Bell },
  { label: "Suporte", href: "/user/support", icon: HeadphonesIcon },
  { label: "Conta", href: "/user/settings", icon: Settings },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#060609] text-white">
      <header className="sticky top-0 z-40 border-b border-[#1A1A24] bg-[#0A0A0F]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-lg p-1.5">
              <Tv2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white">LIVE<span className="text-[#E50914]">SPORTS</span></span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                    isActive ? "bg-[#E50914]/15 text-[#E50914]" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Início</span>
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
