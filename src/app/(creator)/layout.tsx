"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Radio, BarChart3, Settings, LogOut,
  Tv2, Users, HeadphonesIcon, ChevronLeft, Menu,
} from "lucide-react";
import { cn } from "@/utils";
import { getStoredUser, logout } from "@/lib/api";
import BrandIdentity from "@/components/branding/BrandIdentity";

const navItems = [
  { label: "Dashboard", href: "/creator", icon: LayoutDashboard, exact: true },
  { label: "As Minhas Lives", href: "/creator/lives", icon: Radio },
  { label: "Analíticas", href: "/creator/analytics", icon: BarChart3 },
  { label: "Canal", href: "/creator/channel", icon: Tv2 },
  { label: "Suporte", href: "/creator/support", icon: HeadphonesIcon },
  { label: "Definições", href: "/creator/settings", icon: Settings },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u as any);
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const Sidebar = () => (
    <aside className="w-60 h-screen bg-[#0A0A0F] border-r border-[#1A1A24] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[#1A1A24]">
        <Link href="/" className="flex items-center gap-3 group">
          <BrandIdentity mode="creator" subtitle="Creator Studio" />
        </Link>
      </div>

      {user && (
        <div className="p-4 border-b border-[#1A1A24]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-sm font-black text-white flex-shrink-0">
              {user.name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5",
                isActive
                  ? "bg-gradient-to-r from-[#E50914]/15 to-transparent text-[#E50914] border-l-2 border-[#E50914] pl-[10px]"
                  : "text-gray-400 hover:text-white hover:bg-[#111118]"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1A1A24] space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500 hover:text-red-400 hover:bg-[#111118] rounded-lg transition-all">
          <ChevronLeft className="w-4 h-4" /> Ver Site
        </Link>
        <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500 hover:text-yellow-400 hover:bg-[#111118] rounded-lg transition-all">
          <Users className="w-4 h-4" /> Painel Admin
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-500 hover:text-red-400 hover:bg-[#1A1A1A] rounded-lg transition-all">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="w-60 h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-14 flex items-center gap-3 px-4 border-b border-[#1A1A24] bg-[#0A0A0F]">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white">Creator Studio</span>
        </div>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
