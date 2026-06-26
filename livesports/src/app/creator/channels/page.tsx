"use client";

import { useState } from "react";
import { PlayCircle, Plus, Users, Eye, TrendingUp, Settings, Globe, Lock, Edit2 } from "lucide-react";

interface Channel {
  id: string; name: string; description: string; sport: string;
  subscribers: number; views: number; isPublic: boolean; avatar?: string;
}

const DEMO_CHANNELS: Channel[] = [
  { id: "1", name: "Canal Futebol Premium", description: "As melhores transmissões de futebol ao vivo", sport: "Futebol", subscribers: 12400, views: 340000, isPublic: true },
  { id: "2", name: "UFC & MMA Live", description: "Combates ao vivo e exclusivos", sport: "UFC/MMA", subscribers: 8200, views: 190000, isPublic: true },
];

export default function CreatorChannelsPage() {
  const [channels] = useState<Channel[]>(DEMO_CHANNELS);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", sport: "football", isPublic: true });

  const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-violet-400" /> Meus Canais
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Gere os teus canais de transmissão</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Novo Canal
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl border border-violet-500/30 bg-[#0E0E16] p-5">
          <h3 className="text-sm font-bold text-white mb-4">Criar Novo Canal</h3>
          <div className="space-y-3">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome do canal" className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none" />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrição do canal" rows={3}
              className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.sport} onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))}
                className="bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none">
                <option value="football">Futebol</option>
                <option value="basketball">Basquete</option>
                <option value="ufc">UFC/MMA</option>
                <option value="tennis">Ténis</option>
                <option value="f1">Fórmula 1</option>
                <option value="other">Outros</option>
              </select>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#111118] border border-[#1E1E2A]">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400 flex-1">Público</span>
                <button onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                  className={`w-10 h-5 rounded-full transition-colors ${form.isPublic ? "bg-violet-600" : "bg-[#1A1A28]"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${form.isPublic ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl">Criar Canal</button>
            </div>
          </div>
        </div>
      )}

      {channels.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
          <PlayCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Ainda não tens canais</p>
          <button onClick={() => setShowNew(true)} className="mt-2 text-xs text-violet-400 hover:underline">Criar canal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {channels.map((ch) => (
            <div key={ch.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden hover:border-violet-500/20 transition-all">
              <div className="h-20 bg-gradient-to-br from-violet-900/40 to-[#1A1A28] flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg">
                  <PlayCircle className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{ch.name}</h3>
                    <p className="text-xs text-violet-400">{ch.sport}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {ch.isPublic ? (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500"><Globe className="w-3 h-3" />Público</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500"><Lock className="w-3 h-3" />Privado</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{ch.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#111118]">
                    <Users className="w-3 h-3 text-violet-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{formatNum(ch.subscribers)}</p>
                      <p className="text-[9px] text-gray-600">Subscritores</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#111118]">
                    <Eye className="w-3 h-3 text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{formatNum(ch.views)}</p>
                      <p className="text-[9px] text-gray-600">Visualizações</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#111118] hover:bg-[#1A1A28] text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600/15 hover:bg-violet-600/25 text-violet-400 text-xs font-semibold rounded-lg transition-colors">
                    <TrendingUp className="w-3.5 h-3.5" /> Analytics
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
