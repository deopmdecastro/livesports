"use client";

import { useEffect, useState } from "react";
import { UserCircle, Mail, Shield, Calendar, Edit2, Save, X, Lock, Bell, Eye, Smartphone, ShieldCheck, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, getStoredUser } from "@/lib/api";

interface UserProfile {
  id: string; name: string; email: string; avatar?: string;
  role: string; status: string; country?: string; phone?: string;
  emailVerified: boolean; twoFactorEnabled: boolean;
  createdAt: string; lastLoginAt?: string;
}

const ROLE_BADGES: Record<string, string> = {
  super_admin: "bg-[#E50914]/15 text-[#E50914] border-[#E50914]/20",
  admin: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  moderator: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  editor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", country: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [changePwd, setChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirm: "" });

  useEffect(() => {
    const stored = getStoredUser() as any;
    if (stored) { setProfile(stored); setForm({ name: stored.name || "", country: stored.country || "", phone: stored.phone || "" }); }
    apiRequest<UserProfile>("/users/me")
      .then((data) => {
        setProfile(data);
        setForm({ name: data.name || "", country: data.country || "", phone: data.phone || "" });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const updated = await apiRequest<UserProfile>("/users/me", { method: "PATCH", body: JSON.stringify(form) });
      setProfile(updated);
      setEditing(false);
      toast.success("Perfil atualizado!");
    } catch (err) { toast.error("Erro ao guardar"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.newPwd || pwdForm.newPwd !== pwdForm.confirm) {
      toast.error("Verifica os campos de password"); return;
    }
    setSaving(true);
    try {
      await apiRequest("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd }) });
      toast.success("Password alterada com sucesso!");
      setChangePwd(false);
      setPwdForm({ current: "", newPwd: "", confirm: "" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao alterar password"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>;
  if (!profile) return <div className="flex justify-center py-20 text-gray-400">Perfil não disponível</div>;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header Card */}
      <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden shadow-lg">
        <div className="h-32 bg-gradient-to-br from-[#E50914]/45 via-[#B00000]/25 to-transparent relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E16] to-transparent" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="relative z-10 -mt-14 w-24 h-24 rounded-2xl border-4 border-[#0E0E16] bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-4xl font-black text-white flex-shrink-0 shadow-2xl">
              {profile.name?.slice(0, 1).toUpperCase() || "A"}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0E0E16] bg-emerald-500">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>
            <div className="flex-1 min-w-0 pt-1 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-white">{profile.name}</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_BADGES[profile.role] || "bg-gray-500/15 text-gray-400"}`}>
                    {profile.role?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {profile.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-600" /> {profile.email}
                </p>
              </div>
            <button onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 rounded-xl border border-[#2A2A2A] bg-white/[0.02] px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-[#E50914]/30 hover:bg-white/5 transition-all">
              {editing ? <><X className="h-4 w-4" /> Cancelar</> : <><Edit2 className="h-4 w-4" /> Editar</>}
            </button>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3 max-w-md rounded-xl border border-[#1E1E2A] bg-[#111118] p-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-dark w-full px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">País</label>
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="input-dark w-full px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Telefone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-dark w-full px-3 py-2.5 text-sm" />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#E50914]/20 disabled:opacity-60">
                <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Mail, label: "Email", value: profile.email },
                { icon: Shield, label: "Função", value: profile.role },
                { icon: profile.emailVerified ? ShieldCheck : ShieldAlert, label: "Email Verificado", value: profile.emailVerified ? "Verificado" : "Não verificado", tone: profile.emailVerified ? "emerald" : "amber" },
                { icon: Lock, label: "2FA", value: profile.twoFactorEnabled ? "Ativo" : "Inativo", tone: profile.twoFactorEnabled ? "emerald" : "gray" },
                { icon: Calendar, label: "Membro Desde", value: new Date(profile.createdAt).toLocaleDateString("pt-PT") },
                { icon: Bell, label: "Último Acesso", value: profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString("pt-PT") : "N/A" },
                { icon: UserCircle, label: "País", value: profile.country || "—" },
                { icon: Smartphone, label: "Telefone", value: profile.phone || "—" },
              ].map(({ icon: Icon, label, value, tone }) => (
                <div key={label} className="group rounded-xl bg-[#111118] p-3.5 border border-[#1E1E2A] hover:border-[#2A2A3A] transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className={`h-3.5 w-3.5 ${tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-400" : "text-gray-500"}`} />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{label}</span>
                  </div>
                  <p className="text-sm text-white font-medium truncate">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden shadow-lg">
        <div className="p-5 border-b border-[#1E1E2A] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E50914]/10 border border-[#E50914]/20">
                <Lock className="h-3.5 w-3.5 text-[#E50914]" />
              </div>
              Alterar Password
            </h3>
            <p className="text-xs text-gray-500 mt-1 ml-9">Recomendamos alterar a sua password periodicamente</p>
          </div>
          <button onClick={() => setChangePwd(!changePwd)}
            className="flex-shrink-0 rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#E50914]/30 transition-all">
            {changePwd ? "Cancelar" : "Alterar"}
          </button>
        </div>
        {changePwd && (
          <div className="p-5 space-y-3 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Password Atual</label>
              <input type="password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                className="input-dark w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Nova Password</label>
              <input type="password" value={pwdForm.newPwd} onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                className="input-dark w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Confirmar Nova Password</label>
              <input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                className="input-dark w-full px-3 py-2.5 text-sm" />
            </div>
            <button onClick={handleChangePassword} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#E50914]/20 disabled:opacity-60">
              <Save className="h-4 w-4" /> Alterar Password
            </button>
          </div>
        )}
      </div>

      {/* Session Info */}
      <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          </div>
          Informações da Sessão
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { icon: Smartphone, label: "Dispositivo", value: "Browser (Windows/Linux)" },
            { icon: UserCircle, label: "IP", value: "192.168.1.1" },
            { icon: Calendar, label: "Último Login", value: profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("pt-PT") : "N/A" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-[#111118] p-3.5 border border-[#1E1E2A]">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-[10px] text-gray-500 uppercase font-semibold">{label}</span>
              </div>
              <p className="text-sm text-white mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
