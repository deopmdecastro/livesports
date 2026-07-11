"use client";

import { useState } from "react";
import { Key, Plus, Shield, AlertTriangle, RefreshCw, Eye, Lock, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  critical: boolean;
  roles: string[];
}

const PERMISSIONS: Permission[] = [
  { id: "1", name: "lives.manage", description: "Criar, editar e encerrar transmissões ao vivo", module: "Lives", critical: true, roles: ["Super Admin", "Admin", "Editor"] },
  { id: "2", name: "lives.view", description: "Visualizar lista de todas as lives", module: "Lives", critical: false, roles: ["Super Admin", "Admin", "Editor", "Moderador", "Visualizador"] },
  { id: "3", name: "events.manage", description: "Criar, editar e remover eventos", module: "Eventos", critical: false, roles: ["Super Admin", "Admin", "Editor"] },
  { id: "4", name: "users.manage", description: "Gerir, suspender e banir utilizadores", module: "Utilizadores", critical: true, roles: ["Super Admin", "Admin"] },
  { id: "5", name: "users.view", description: "Visualizar lista de utilizadores", module: "Utilizadores", critical: false, roles: ["Super Admin", "Admin", "Moderador"] },
  { id: "6", name: "ads.manage", description: "Criar e gerir campanhas publicitárias", module: "Anúncios", critical: true, roles: ["Super Admin", "Admin"] },
  { id: "7", name: "ads.view", description: "Visualizar métricas de anúncios", module: "Anúncios", critical: false, roles: ["Super Admin", "Admin", "Editor", "Visualizador"] },
  { id: "8", name: "settings.write", description: "Alterar configurações globais da plataforma", module: "Configurações", critical: true, roles: ["Super Admin"] },
  { id: "9", name: "settings.read", description: "Ler configurações da plataforma", module: "Configurações", critical: false, roles: ["Super Admin", "Admin"] },
  { id: "10", name: "api_keys.manage", description: "Gerir chaves de API externas", module: "API Keys", critical: true, roles: ["Super Admin"] },
  { id: "11", name: "reports.view", description: "Aceder a relatórios e analytics", module: "Relatórios", critical: false, roles: ["Super Admin", "Admin", "Visualizador"] },
  { id: "12", name: "support.respond", description: "Responder a tickets de suporte", module: "Suporte", critical: false, roles: ["Super Admin", "Admin", "Moderador"] },
];

const MODULES = Array.from(new Set(PERMISSIONS.map((p) => p.module)));

export default function PermissionsPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? PERMISSIONS : PERMISSIONS.filter((p) => p.module === filter);

  const stats = {
    total: PERMISSIONS.length,
    critical: PERMISSIONS.filter((p) => p.critical).length,
    modules: MODULES.length,
    roles: Array.from(new Set(PERMISSIONS.flatMap((p) => p.roles))).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-[#E50914]" /> Matriz de Permissões
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats.total} permissões · {stats.critical} críticas · {stats.modules} módulos · {stats.roles} funções
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Permissões", value: stats.total, icon: Key, color: "text-[#E50914]" },
          { label: "Críticas", value: stats.critical, icon: Lock, color: "text-red-400" },
          { label: "Módulos", value: stats.modules, icon: Eye, color: "text-red-400" },
          { label: "Funções", value: stats.roles, icon: Shield, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 flex items-center gap-3">
            <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
            <div>
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[10px] text-gray-500 uppercase">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
            filter === "all" ? "bg-[#E50914] text-white" : "bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#2A2A2A]"
          }`}>Todas</button>
        {MODULES.map((m) => (
          <button key={m} onClick={() => setFilter(m)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
              filter === m ? "bg-[#E50914] text-white" : "bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#2A2A2A]"
            }`}>{m}</button>
        ))}
      </div>

      {/* Permissions Grid */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((perm) => (
          <div key={perm.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 hover:border-[#E50914]/20 transition-all">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono font-bold text-[#E50914]">{perm.name}</code>
                {perm.critical && (
                  <span className="flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                    <AlertTriangle className="h-2.5 w-2.5" /> Crítica
                  </span>
                )}
              </div>
              <span className="rounded-full bg-[#1A1A2A] border border-[#2A2A3A] px-2 py-0.5 text-[9px] text-gray-500">{perm.module}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{perm.description}</p>
            <div className="flex flex-wrap gap-1">
              {perm.roles.map((role) => (
                <span key={role} className="rounded-full bg-[#1A1A2A] px-2 py-0.5 text-[9px] font-semibold text-gray-400 border border-[#2A2A3A]">
                  {role}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
