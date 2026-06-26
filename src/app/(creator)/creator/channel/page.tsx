"use client";

import { useEffect, useState } from "react";
import { Tv2, Save, Globe, Instagram, Twitter, Youtube, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface Channel {
  id?: string;
  name: string;
  slug: string;
  description: string;
  avatar: string;
  banner: string;
  sport: string;
  country: string;
  websiteUrl: string;
  socialLinks: Record<string, string>;
  status?: string;
  verified?: boolean;
  subscriberCount?: number;
  totalViews?: number;
}

const SPORTS = ["Futebol", "Basquete", "Ténis", "UFC/MMA", "F1", "Voleibol", "Baseball", "Outros"];

const defaultChannel: Channel = {
  name: "", slug: "", description: "", avatar: "", banner: "",
  sport: "", country: "", websiteUrl: "", socialLinks: {},
};

export default function CreatorChannelPage() {
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChannel, setHasChannel] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    apiRequest<Channel | null>("/creator/me")
      .then((data) => {
        if (data) { setChannel(data as any); setHasChannel(true); }
        else setChannel(defaultChannel);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!channel.name || !channel.slug) { toast.error("Nome e slug são obrigatórios"); return; }
    setSaving(true);
    try {
      const method = hasChannel ? "PATCH" : "POST";
      const url = hasChannel ? "/creator/channel" : "/creator/channel";
      const data = await apiRequest<Channel>(url, { method, body: JSON.stringify(channel) });
      setChannel(data as any);
      setHasChannel(true);
      toast.success(hasChannel ? "Canal atualizado!" : "Canal criado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar canal");
    } finally { setSaving(false); }
  };

  const handleApply = async () => {
    if (!channel.name) { toast.error("Preenche o nome do canal antes de candidatares"); return; }
    setApplying(true);
    try {
      await apiRequest("/creator/apply", {
        method: "POST",
        body: JSON.stringify({ channel_name: channel.name, description: channel.description, sport: channel.sport }),
      });
      toast.success("Candidatura enviada! Aguarda aprovação.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar candidatura");
    } finally { setApplying(false); }
  };

  const set = (field: keyof Channel, value: string) => setChannel((prev) => ({ ...prev, [field]: value }));
  const setSocial = (key: string, value: string) =>
    setChannel((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value } }));

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Tv2 className="h-6 w-6 text-[#E50914]" />
        <div>
          <h1 className="text-xl font-black text-white">{hasChannel ? "Editar Canal" : "Criar Canal"}</h1>
          <p className="text-xs text-gray-500">Configura a tua presença na plataforma</p>
        </div>
      </div>

      {!hasChannel && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-300">
            Preenche os dados e cria o teu canal. Após criado, o canal ficará em análise antes de ser ativado.
            Também podes <button onClick={handleApply} className="text-blue-400 font-bold underline">enviar candidatura para criador</button>.
          </p>
        </div>
      )}

      {hasChannel && channel.status && (
        <div className={`rounded-xl border p-4 flex gap-3 ${
          channel.status === 'active' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
        }`}>
          {channel.status === 'active'
            ? <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            : <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />}
          <div>
            <p className={`text-sm font-semibold ${channel.status === 'active' ? 'text-emerald-300' : 'text-yellow-300'}`}>
              Canal {channel.status === 'active' ? 'Ativo' : channel.status === 'pending' ? 'Em Análise' : channel.status}
            </p>
            {channel.status === 'pending' && (
              <p className="text-xs text-yellow-200/70 mt-0.5">O teu canal está a ser analisado pela equipa.</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-6 space-y-5">
        <h2 className="text-sm font-bold text-white border-b border-[#1E1E2A] pb-3">Informações Básicas</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nome do Canal *</label>
            <input value={channel.name} onChange={(e) => set("name", e.target.value)}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="Ex: SportsHub PT" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Slug *</label>
            <input value={channel.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="sportshub-pt" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Descrição</label>
          <textarea value={channel.description} onChange={(e) => set("description", e.target.value)}
            rows={3} className="input-dark w-full px-3 py-2 text-sm rounded-lg resize-none"
            placeholder="Descreve o teu canal e o tipo de conteúdo..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Desporto Principal</label>
            <select value={channel.sport} onChange={(e) => set("sport", e.target.value)}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg">
              <option value="">Selecionar...</option>
              {SPORTS.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">País</label>
            <input value={channel.country} onChange={(e) => set("country", e.target.value)}
              className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="Portugal" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">URL do Avatar</label>
          <input value={channel.avatar} onChange={(e) => set("avatar", e.target.value)}
            className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">URL do Banner</label>
          <input value={channel.banner} onChange={(e) => set("banner", e.target.value)}
            className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="https://..." />
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-6 space-y-4">
        <h2 className="text-sm font-bold text-white border-b border-[#1E1E2A] pb-3">Redes Sociais</h2>
        {[
          { key: "website", icon: Globe, label: "Website" },
          { key: "youtube", icon: Youtube, label: "YouTube" },
          { key: "instagram", icon: Instagram, label: "Instagram" },
          { key: "twitter", icon: Twitter, label: "Twitter / X" },
        ].map(({ key, icon: Icon, label }) => (
          <div key={key} className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-1">{label}</label>
              <input value={channel.socialLinks?.[key] || ""}
                onChange={(e) => setSocial(key, e.target.value)}
                className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder={`https://${key}.com/...`} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        {!hasChannel && (
          <button onClick={handleApply} disabled={applying}
            className="flex items-center gap-2 rounded-xl border border-[#E50914]/30 px-4 py-2 text-sm text-[#E50914] hover:bg-[#E50914]/10 transition-colors disabled:opacity-60">
            {applying ? "A enviar..." : "Candidatar como Criador"}
          </button>
        )}
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white hover:bg-[#B00000] transition-colors disabled:opacity-60">
          <Save className="h-4 w-4" />
          {saving ? "A guardar..." : hasChannel ? "Guardar Alterações" : "Criar Canal"}
        </button>
      </div>
    </div>
  );
}
