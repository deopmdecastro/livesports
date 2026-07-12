"use client";

import { useEffect, useState } from "react";
import {
  Settings, User, Shield, Save, KeyRound, ShieldCheck, ShieldAlert,
  Mail, CalendarDays, LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiRequest, getStoredUser, setStoredUser, logout } from "@/lib/api";

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  country: string | null;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  user: "Utilizador",
  creator: "Criador",
  moderator: "Moderador",
  admin: "Administrador",
  super_admin: "Super Admin",
};

export default function CreatorSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [form, setForm] = useState({ name: "", avatar: "", country: "", phone: "" });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    apiRequest<Profile>("/auth/me")
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || "",
          avatar: data.avatar || "",
          country: data.country || "",
          phone: data.phone || "",
        });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erro ao carregar perfil"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { toast.error("O nome não pode ficar vazio"); return; }
    setSavingProfile(true);
    try {
      const updated = await apiRequest<Profile>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          avatar: form.avatar.trim(),
          country: form.country.trim(),
          phone: form.phone.trim(),
        }),
      });
      setProfile(updated);
      // Keep the sidebar/header in sync with the change without a full reload.
      const stored = getStoredUser<Record<string, unknown>>();
      if (stored) setStoredUser({ ...stored, ...updated });
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) { toast.error("Preenche a senha atual e a nova senha"); return; }
    if (pwd.newPassword.length < 8) { toast.error("A nova senha precisa de pelo menos 8 caracteres"); return; }
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error("As senhas não coincidem"); return; }
    setSavingPassword(true);
    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }),
      });
      toast.success("Senha alterada com sucesso! As outras sessões foram encerradas.");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>;
  }

  if (!profile) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-gray-400">Não foi possível carregar o teu perfil. Tenta novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-[#E50914]" />
        <div>
          <h1 className="text-xl font-black text-white">Definições</h1>
          <p className="text-xs text-gray-500">Gere o teu perfil, segurança e sessão</p>
        </div>
      </div>

      {/* ─── Perfil ─── */}
      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#1E1E2A] pb-3">
          <User className="h-4 w-4 text-gray-500" /> Perfil
        </h2>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E50914] to-[#B00000] flex items-center justify-center text-lg font-black text-white flex-shrink-0 overflow-hidden">
            {form.avatar
              ? <img src={form.avatar} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : (form.name?.slice(0, 1).toUpperCase() || "?")}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">URL do Avatar</label>
            <input value={form.avatar} onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nome *</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="O teu nome" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Telefone</label>
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="+351 900 000 000" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">País</label>
            <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="Portugal" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email</label>
            <input value={profile.email} disabled
              className="input-dark w-full px-3 py-2 text-sm rounded-lg opacity-50 cursor-not-allowed" />
            <p className="text-[10px] text-gray-600 mt-1">O email não pode ser alterado aqui.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSaveProfile} disabled={savingProfile}
            className="flex items-center gap-2 rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white hover:bg-[#B00000] transition-colors disabled:opacity-60">
            <Save className="h-4 w-4" />
            {savingProfile ? "A guardar..." : "Guardar Perfil"}
          </button>
        </div>
      </div>

      {/* ─── Segurança ─── */}
      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#1E1E2A] pb-3">
          <Shield className="h-4 w-4 text-gray-500" /> Segurança
        </h2>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Senha Atual</label>
          <input type="password" value={pwd.currentPassword}
            onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
            className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="••••••••" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nova Senha</label>
            <input type="password" value={pwd.newPassword}
              onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Confirmar Nova Senha</label>
            <input type="password" value={pwd.confirmPassword}
              onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="Repete a nova senha" />
          </div>
        </div>
        <p className="text-[10px] text-gray-600">
          Ao alterar a senha, todas as outras sessões abertas noutros dispositivos serão encerradas.
        </p>

        <div className="flex justify-end">
          <button onClick={handleChangePassword} disabled={savingPassword}
            className="flex items-center gap-2 rounded-xl border border-[#E50914]/30 px-4 py-2 text-sm text-[#E50914] hover:bg-[#E50914]/10 transition-colors disabled:opacity-60">
            <KeyRound className="h-4 w-4" />
            {savingPassword ? "A alterar..." : "Alterar Senha"}
          </button>
        </div>
      </div>

      {/* ─── Conta ─── */}
      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-6 space-y-4">
        <h2 className="text-sm font-bold text-white border-b border-[#1E1E2A] pb-3">Conta</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Mail className="h-4 w-4 flex-shrink-0" />
            {profile.emailVerified
              ? <span className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /> Email verificado</span>
              : <span className="flex items-center gap-1.5 text-yellow-400"><ShieldAlert className="h-3.5 w-3.5" /> Email não verificado</span>}
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            <span>Tipo de conta: <span className="text-white font-semibold">{roleLabels[profile.role] || profile.role}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <CalendarDays className="h-4 w-4 flex-shrink-0" />
            <span>Membro desde {new Date(profile.createdAt).toLocaleDateString("pt-PT", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            {profile.twoFactorEnabled
              ? <span className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /> Autenticação em 2 fatores ativa</span>
              : <span className="flex items-center gap-1.5 text-gray-500"><ShieldAlert className="h-3.5 w-3.5" /> Autenticação em 2 fatores inativa</span>}
          </div>
        </div>

        <div className="flex justify-end border-t border-[#1E1E2A] pt-4">
          <button onClick={handleLogout} disabled={loggingOut}
            className="flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-60">
            <LogOut className="h-4 w-4" />
            {loggingOut ? "A terminar sessão..." : "Terminar Sessão"}
          </button>
        </div>
      </div>
    </div>
  );
}
