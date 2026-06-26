"use client";

import { useState } from "react";
import { Settings, User, Lock, Bell, Trash2, Save } from "lucide-react";

export default function UserSettingsPage() {
  const [profile, setProfile] = useState({ name: "", email: "", country: "" });
  const [notifs, setNotifs] = useState({ liveAlerts: true, newsAlerts: true, supportReplies: true });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-400" /> Definições da Conta
        </h1>
        <p className="text-sm text-gray-400 mt-1">Gere o teu perfil e preferências</p>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-[#1E1E2A]">
          <User className="w-4 h-4 text-[#E50914]" />
          <h3 className="text-sm font-bold text-white">Informações Pessoais</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E50914] to-[#7A0000] flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
              U
            </div>
            <div>
              <button className="text-xs text-[#E50914] hover:underline">Alterar foto</button>
              <p className="text-xs text-gray-600 mt-0.5">JPG, PNG. Máx. 2MB</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome</label>
              <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="O teu nome"
                className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">País</label>
              <input value={profile.country} onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                placeholder="Portugal"
                className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              type="email" placeholder="email@exemplo.com"
              className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none" />
          </div>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-[#B00000] text-white text-sm font-bold rounded-xl transition-colors">
              <Save className="w-4 h-4" /> Guardar Alterações
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-[#1E1E2A]">
          <Lock className="w-4 h-4 text-[#E50914]" />
          <h3 className="text-sm font-bold text-white">Segurança</h3>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Palavra-passe atual</label>
            <input type="password" placeholder="••••••••"
              className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nova palavra-passe</label>
              <input type="password" placeholder="••••••••"
                className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Confirmar</label>
              <input type="password" placeholder="••••••••"
                className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none" />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#111118] hover:bg-[#1A1A28] border border-[#1E1E2A] text-white text-sm font-bold rounded-xl transition-colors">
              <Lock className="w-4 h-4" /> Atualizar Senha
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-[#1E1E2A]">
          <Bell className="w-4 h-4 text-[#E50914]" />
          <h3 className="text-sm font-bold text-white">Notificações</h3>
        </div>
        <div className="divide-y divide-[#1E1E2A]">
          {[
            { key: "liveAlerts", label: "Alertas de lives ao vivo", desc: "Recebe alertas quando starts lives importantes" },
            { key: "newsAlerts", label: "Notícias e atualizações", desc: "Novidades e resultados de jogos" },
            { key: "supportReplies", label: "Respostas de suporte", desc: "Quando o suporte responde ao teu ticket" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                className={`w-10 h-5 rounded-full transition-all flex-shrink-0 ${notifs[key as keyof typeof notifs] ? "bg-[#E50914]" : "bg-[#1A1A28]"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${notifs[key as keyof typeof notifs] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Zona de Perigo
        </h3>
        <p className="text-xs text-gray-500 mb-3">Esta ação é irreversível e eliminará a tua conta permanentemente.</p>
        <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl border border-red-500/20 transition-colors">
          Eliminar Conta
        </button>
      </div>
    </div>
  );
}
