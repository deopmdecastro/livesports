"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  BarChart3,
  Settings,
  LogOut,
  Tv2,
  HeadphonesIcon,
  ChevronLeft,
  Menu,
  X,
  ExternalLink,
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

function pageTitle(pathname: string | null) {
  if (!pathname) return "Creator Studio";
  if (pathname === "/creator") return "Dashboard";
  if (pathname.startsWith("/creator/lives")) return "As Minhas Lives";
  if (pathname.startsWith("/creator/analytics")) return "Analíticas";
  if (pathname.startsWith("/creator/channel")) return "Canal";
  if (pathname.startsWith("/creator/support")) return "Suporte";
  if (pathname.startsWith("/creator/settings")) return "Definições";
  return "Creator Studio";
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u as { name: string; email: string; avatar?: string });
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="border-b border-[#1E1E2A] p-4">
        <Link href="/" className="block" onClick={onNavigate}>
          <BrandIdentity mode="creator" subtitle="Creator Studio" />
        </Link>
      </div>

      {user ? (
        <div className="border-b border-[#1E1E2A] p-4">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-[#E50914]/20" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E50914] to-[#B00000] text-sm font-black text-white">
                {(user.name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-[#E50914]/12 text-[#ff6b73] ring-1 ring-[#E50914]/25"
                  : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-[#E50914]" : "text-gray-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-[#1E1E2A] p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver site público
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-[#060609]">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[#1E1E2A] bg-[#0A0A10] lg:flex">
        <Nav />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col border-r border-[#1E1E2A] bg-[#0A0A10] shadow-2xl transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-end p-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Nav onNavigate={() => setSidebarOpen(false)} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#1E1E2A] bg-[#0A0A10]/95 px-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{pageTitle(pathname)}</p>
            <p className="hidden text-[10px] text-gray-500 sm:block">Creator Studio · LiveSports</p>
          </div>
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-gray-400 transition-colors hover:border-white/20 hover:text-white sm:inline-flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Site
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 lg:p-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
