"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { cn } from "@/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#08080C] text-white">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AdminSidebar />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!sidebarOpen}
      >
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] transform transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de administração"
        >
          <AdminSidebar
            onNavigate={() => setSidebarOpen(false)}
            showClose
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuToggle={() => setSidebarOpen(true)} />
        <main className="admin-main flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
