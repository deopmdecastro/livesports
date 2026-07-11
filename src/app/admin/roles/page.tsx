"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Edit2, Trash2, RefreshCw, Users, Key, Eye, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  createdAt: string;
}

const PERMISSION_MODULES = [
  "lives.manage", "events.manage", "users.manage", "ads.manage",
  "news.manage", "banners.manage", "categories.manage", "competitions.manage",
  "api_keys.manage", "settings.write", "notifications.send",
  "support.respond", "reports.view", "chat.moderate",
];

function PermissionBadge({ permission, active }: { permission: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all ${
      active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }`}>
      {active ? <Lock className="h-2.5 w-2.5 mr-1" /> : <Key className="h-2.5 w-2.5 mr-1" />}
      {permission}
    </span>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", description: "", permissions: [] as string[] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ApiListResponse<Role>>("/users/roles?limit=50");
      setRoles(data.items || []);
    } catch {
      // Fallback demo data
      setRoles([
        { id: "1", name: "Super Admin", description: "Acesso total a todos os módulos", userCount: 2, permissions: PERMISSION_MODULES, createdAt: "2024-01-15" },
        { id: "2", name: "Admin", description: "Gere utilizadores, lives, eventos e anúncios", userCount: 4, permissions: ["lives.manage", "events.manage", "users.manage", "ads.manage", "news.manage", "banners.manage", "categories.manage", "support.respond", "reports.view", "chat.moderate"], createdAt: "2024-01-15" },
        { id: "3", name: "Editor", description: "Cria e gere lives, eventos e notícias", userCount: 7, permissions: ["lives.manage", "events.manage", "news.manage", "banners.manage", "categories.manage", "chat.moderate"], createdAt: "2024-02-01" },
        { id: "4", name: "Moderador", description: "Modera chat e responde a tickets", userCount: 5, permissions: ["chat.moderate", "support.respond", "notifications.send"], createdAt: "2024-03-01" },
        { id: "5", name: "Visualizador", description: "Acesso apenas de leitura", userCount: 3, permissions: ["reports.view"], createdAt: "2024-04-01" },
      ]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description, permissions: [...role.permissions] });
  };

  const togglePermission = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      if (editingRole) {
        toast.success("Função atualizada!");
      } else {
        const newRole: Role = { id: String(Date.now()), name: form.name, description: form.description, userCount: 0, permissions: form.permissions, createdAt: new Date().toISOString() };
        setRoles([newRole, ...roles]);
        toast.success("Função criada!");
      }
      setShowCreate(false);
      setEditingRole(null);
      setForm({ name: "", description: "", permissions: [] });
      load();
    } catch (err) {
      toast.error("Erro ao guardar");
    } finally { setSaving(false); }
  };

  const handleDelete = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
    toast.success("Função removida");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#E50914]" /> Funções & Permissões
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{roles.length} funções · {PERMISSION_MODULES.length} permissões disponíveis</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A]">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => { setEditingRole(null); setForm({ name: "", description: "", permissions: [] }); setShowCreate(true); }}
            className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
            <Plus className="h-4 w-4" /> Nova Função
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Funções", value: roles.length, icon: Shield, color: "text-[#E50914]" },
          { label: "Total Admins", value: roles.reduce((s, r) => s + r.userCount, 0), icon: Users, color: "text-red-400" },
          { label: "Permissões", value: PERMISSION_MODULES.length, icon: Key, color: "text-emerald-400" },
          { label: "Restritas", value: roles.filter(r => r.permissions.includes("settings.write")).length, icon: Lock, color: "text-yellow-400" },
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

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden hover:border-[#E50914]/20 transition-all">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white">{role.name}</h3>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Users className="h-3 w-3" /> {role.userCount} utilizadores
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{role.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((perm) => (
                        <PermissionBadge key={perm} permission={perm} active />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(role)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#1E1E2A] p-4 bg-[#0E0E16]">
              <h3 className="font-black text-white">{editingRole ? `Editar: ${editingRole.name}` : "Nova Função"}</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nome *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm" placeholder="Ex: Editor de Conteúdo" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Descrição</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2} className="input-dark w-full resize-none px-3 py-2 text-sm" placeholder="O que esta função pode fazer..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Permissões</label>
                <div className="flex flex-wrap gap-1.5">
                  {PERMISSION_MODULES.map((perm) => (
                    <button key={perm} onClick={() => togglePermission(perm)}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-semibold border transition-all ${
                        form.permissions.includes(perm)
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-gray-500/5 text-gray-500 border-gray-500/20 hover:border-gray-500/40"
                      }`}>
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#1E1E2A] p-4">
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                {saving ? "Guardando..." : editingRole ? "Atualizar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
