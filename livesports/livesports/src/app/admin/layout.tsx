"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { cn } from "@/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      {/* Sidebar - Desktop (fixed height, scrolls internally) */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-60 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar />
          </div>
        </div>
      )}

      {/* Main Content — header stays fixed, only <main> scrolls */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
