"use client";

import { useState } from "react";
import { Settings, User, Bell, Shield, Save } from "lucide-react";

export default function CreatorSettingsPage() {
  const [profile, setProfile] = useState({ name: "Criador", email: "", bio: "", country: "" });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-400" /> Definições
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Gere o teu perfil e preferências</p>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-[#1E1E2A]">
          <User className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Perfil</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome</label>
              <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                type="email" className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bio</label>
            <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={3} className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none resize-none" />
          </div>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors">
              <Save className="w-4 h-4" /> Guardar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-[#1E1E2A]">
          <Bell className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Notificações</h3>
        </div>
        <div className="p-4 space-y-3">
          {["Novos espectadores", "Mensagens no chat", "Tickets de suporte respondidos", "Recordes de audiência"].map((item) => (
            <div key={item} className="flex items-center justify-between py-2 border-b border-[#1E1E2A] last:border-0">
              <span className="text-sm text-gray-300">{item}</span>
              <div className="w-10 h-5 rounded-full bg-violet-600 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white mt-0.5 translate-x-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
