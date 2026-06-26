"use client";

import { useEffect, useState } from "react";
import { User, Mail, Globe, Phone, Shield, Calendar, Edit2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { getStoredUser, apiRequest } from "@/lib/api";

interface UserProfile {
  id: string; name: string; email: string; avatar?: string;
  role: string; status: string; country?: string; phone?: string;
  emailVerified: boolean; twoFactorEnabled: boolean;
  createdAt: string; lastLoginAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", admin: "Administrador", moderator: "Moderador",
  editor: "Editor", creator: "Criador", user: "Utilizador",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  suspended: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  banned: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", country: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = getStoredUser() as any;
    if (u) { setProfile(u); setForm({ name: u.name || "", country: u.country || "", phone: u.phone || "" }); }
    apiRequest<UserProfile>("/users/me")
      .then((data) => { setProfile(data); setForm({ name: data.name, country: data.country || "", phone: data.phone || "" }); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    try {
      const updated = await apiRequest<UserProfile>("/users/me", { method: "PATCH", body: JSON.stringify(form) });
      setProfile(updated); setEditing(false);
      toast.success("Perfil atualizado!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao guardar"); }
    finally { setSaving(false); }
  };

  if (!profile) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#E50914]/30 via-[#B00000]/20 to-transparent" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#0E0E16] bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
              {profile.name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-white">{profile.name}</h1>
                <span className="text-xs text-gray-400">{ROLE_LABELS[profile.role] || profile.role}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[profile.status] || ""}`}>
                  {profile.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
            </div>
            <button onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 rounded-xl border border-[#2A2A2A] px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-[#E50914]/30 transition-all">
              {editing ? <X className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
              {editing ? "Cancelar" : "Editar"}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-sm rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">País</label>
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="Portugal" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Telefone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="+351..." />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-60 transition-colors">
                <Save className="h-3.5 w-3.5" />
                {saving ? "A guardar..." : "Guardar"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: Mail, label: "Email", value: profile.email },
                { icon: Globe, label: "País", value: profile.country || "—" },
                { icon: Phone, label: "Telefone", value: profile.phone || "—" },
                { icon: Shield, label: "Email verificado", value: profile.emailVerified ? "✓ Verificado" : "Não verificado" },
                { icon: Calendar, label: "Membro desde", value: new Date(profile.createdAt).toLocaleDateString("pt-PT") },
                { icon: User, label: "Último acesso", value: profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString("pt-PT") : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg bg-[#1A1A2A] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="text-sm text-white font-medium truncate">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <h3 className="text-sm font-bold text-white mb-3">Segurança</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white">Autenticação em dois fatores</p>
              <p className="text-xs text-gray-500">Protege a tua conta com 2FA</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${profile.twoFactorEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>
              {profile.twoFactorEnabled ? "Ativo" : "Inativo"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[#1E1E2A]">
            <div>
              <p className="text-sm text-white">Email verificado</p>
              <p className="text-xs text-gray-500">{profile.email}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${profile.emailVerified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
              {profile.emailVerified ? "✓ Verificado" : "Pendente"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
