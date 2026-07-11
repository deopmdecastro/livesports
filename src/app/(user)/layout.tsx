"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, BookOpen, HeadphonesIcon, Heart, Settings, LogOut, ChevronLeft, Tv2 } from "lucide-react";
import { cn } from "@/utils";
import { getStoredUser, logout } from "@/lib/api";

const navItems = [
  { label: "O Meu Perfil", href: "/me", icon: User, exact: true },
  { label: "Lista de Favoritos", href: "/me/watchlist", icon: Heart },
  { label: "Histórico", href: "/me/history", icon: BookOpen },
  { label: "Suporte", href: "/me/tickets", icon: HeadphonesIcon },
  { label: "Definições", href: "/me/settings", icon: Settings },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string; role: string } | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) { router.replace("/login"); }
    else setUser(u as any);
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#060609]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <aside className="w-52 flex-shrink-0 hidden md:block">
            <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
              {user && (
                <div className="p-4 border-b border-[#1E1E2A]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                      {user.name?.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}
              <nav className="p-2">
                {navItems.map((item) => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5",
                        isActive ? "bg-[#E50914]/15 text-[#E50914]" : "text-gray-400 hover:text-white hover:bg-[#111118]"
                      )}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="mt-2 pt-2 border-t border-[#1E1E2A] space-y-0.5">
                  <Link href="/" className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500 hover:text-red-400 rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Voltar ao Site
                  </Link>
                  {user?.role !== 'user' && (
                    <Link href="/creator" className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500 hover:text-yellow-400 rounded-lg transition-colors">
                      <Tv2 className="w-4 h-4" /> Creator Studio
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-500 hover:text-red-400 rounded-lg transition-all">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex gap-1 md:hidden overflow-x-auto mb-4 pb-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className={cn("flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                      ? "bg-[#E50914] text-white" : "bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A]"
                  )}>
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
