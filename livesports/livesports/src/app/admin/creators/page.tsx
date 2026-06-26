"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Users, Eye, Radio, Plus, Search, Edit2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { formatNumber } from "@/utils";
import { apiRequest, type ApiListResponse } from "@/lib/api";
import type { User } from "@/types";
import Link from "next/link";

interface Creator extends User {
  livesCount?: number;
  totalViews?: number;
  subscribers?: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiRequest<ApiListResponse<Creator>>("/users?limit=100")
      .then((r) => {
        const users = r.items || [];
        const filtered = users.filter((u) => ["editor", "moderator", "admin", "super_admin"].includes(u.role));
        setCreators(filtered);
      })
      .catch(() => setCreators([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = creators.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-[#E50914]" /> Criadores de Conteúdo
          </h1>
          <p className="text-xs text-gray-500">Gere os criadores da plataforma</p>
        </div>
        <Link href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-[#B00000] text-white text-sm font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Novo Criador
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Criadores", value: creators.length, icon: Users, color: "#7C3AED" },
          { label: "Ativos", value: creators.filter((c) => c.status === "active").length, icon: CheckCircle, color: "#22C55E" },
          { label: "Suspensos", value: creators.filter((c) => c.status === "suspended").length, icon: XCircle, color: "#EF4444" },
          { label: "Editores", value: creators.filter((c) => c.role === "editor").length, icon: PlayCircle, color: "#3B82F6" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
        <div className="p-4 border-b border-[#1E1E2A] flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar criadores..."
              className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-[#E50914]/50 outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-[#1A1A28] animate-pulse rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <PlayCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum criador encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E1E2A]">
            {filtered.map((creator) => (
              <div key={creator.id} className="flex items-center gap-4 p-4 hover:bg-[#111118] transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
                  {creator.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{creator.name}</p>
                  <p className="text-xs text-gray-500">{creator.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${creator.role === "editor" ? "bg-violet-500/15 text-violet-400" : creator.role === "moderator" ? "bg-blue-500/15 text-blue-400" : "bg-[#E50914]/15 text-[#E50914]"}`}>
                    {creator.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${creator.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {creator.status}
                  </span>
                </div>
                <p className="hidden lg:block text-xs text-gray-600 flex-shrink-0">Desde {formatDate(creator.createdAt)}</p>
                <Link href={`/admin/users/${creator.id}`} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors flex-shrink-0">
                  <Edit2 className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
