"use client";

import { useEffect, useState } from "react";
import { Key, Shield, AlertTriangle, Lock, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  critical: boolean;
  roles: string[];
}

interface RoleItem {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

const PERMISSION_DATA: Permission[] = [
  { id: "1", name: "lives.manage", description: "Criar, editar e encerrar transmissoes ao vivo", module: "Lives", critical: true, roles: [] },
  { id: "2", name: "events.manage", description: "Criar, editar e remover eventos", module: "Eventos", critical: false, roles: [] },
  { id: "3", name: "users.manage", description: "Gerir, suspender e banir utilizadores", module: "Utilizadores", critical: true, roles: [] },
  { id: "4", name: "ads.manage", description: "Criar e gerir campanhas publicitarias", module: "Anuncios", critical: true, roles: [] },
  { id: "5", name: "news.manage", description: "Gerir noticias e artigos", module: "Noticias", critical: false, roles: [] },
  { id: "6", name: "banners.manage", description: "Gerir banners do site", module: "Banners", critical: false, roles: [] },
  { id: "7", name: "categories.manage", description: "Gerir categorias de desporto", module: "Categorias", critical: false, roles: [] },
  { id: "8", name: "competitions.manage", description: "Gerir ligas e competicoes", module: "Competicoes", critical: false, roles: [] },
  { id: "9", name: "api_keys.manage", description: "Gerir chaves de API externas", module: "API Keys", critical: true, roles: [] },
  { id: "10", name: "settings.write", description: "Alterar configuracoes globais", module: "Configuracoes", critical: true, roles: [] },
  { id: "11", name: "reports.view", description: "Aceder a relatorios e analytics", module: "Relatorios", critical: false, roles: [] },
  { id: "12", name: "support.respond", description: "Responder a tickets de suporte", module: "Suporte", critical: false, roles: [] },
  { id: "13", name: "chat.moderate", description: "Moderar chat das lives", module: "Chat", critical: false, roles: [] },
  { id: "14", name: "notifications.send", description: "Enviar notificacoes push", module: "Notificacoes", critical: false, roles: [] },
];

const MODULES = Array.from(new Set(PERMISSION_DATA.map(p => p.module)));

export default function PermissionsPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiRequest<{ items: RoleItem[] }>("/users/roles?limit=50");
        setRoles(data.items || []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar funcoes");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const permissions = PERMISSION_DATA.map(p => ({
    ...p,
    roles: roles.filter(r => r.permissions.includes(p.name)).map(r => r.name),
  }));

  const filtered = filter === "all" ? permissions : permissions.filter(p => p.module === filter);

  const stats = {
    total: PERMISSION_DATA.length,
    critical: PERMISSION_DATA.filter(p => p.critical).length,
    modules: MODULES.length,
    roles: roles.length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-[#E50914]" /> Matriz de Permissoes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats.total} permissoes · {stats.critical} criticas · {stats.modules} modulos · {stats.roles} funcoes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Permissoes", value: stats.total, icon: Key, color: "text-[#E50914]" },
          { label: "Criticas", value: stats.critical, icon: AlertTriangle, color: "text-red-400" },
          { label: "Modulos", value: stats.modules, icon: Shield, color: "text-emerald-400" },
          { label: "Funcoes", value: stats.roles, icon: Lock, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 flex items-center gap-3">
            <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
            <div><p className="text-xl font-black text-white">{value}</p><p className="text-[10px] text-gray-500 uppercase">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setFilter("all")} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${filter === "all" ? "bg-[#E50914] text-white" : "border border-[#2A2A2A] text-gray-400 hover:text-white"}`}>Todos</button>
        {MODULES.map(m => (
          <button key={m} onClick={() => setFilter(m)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${filter === m ? "bg-[#E50914] text-white" : "border border-[#2A2A2A] text-gray-400 hover:text-white"}`}>{m}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#1E1E2A]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#1E1E2A] bg-[#0A0A12]">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Permissao</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Modulo</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Tipo</th>
                  {roles.map(r => (
                    <th key={r.name} className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">{r.name.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-[#1A1A2A] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{p.description}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">{p.module}</td>
                    <td className="px-4 py-3">
                      {p.critical ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          <AlertTriangle className="w-2.5 h-2.5" /> Critica
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500">Normal</span>
                      )}
                    </td>
                    {roles.map(r => (
                      <td key={r.name} className="px-3 py-3 text-center">
                        {p.roles.includes(r.name) ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-700 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
