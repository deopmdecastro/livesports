"use client";

import { useState } from "react";
import {
  Key, X, ArrowRight, ExternalLink, Eye, EyeOff,
  CheckCircle, Info, Tv2, Trophy, BarChart3, Cloud, Zap,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

// ─── Provider catalogue ───────────────────────────────────────────────────────

const PROVIDER_CATALOGUE = [
  {
    id: "api_football",
    label: "API-Football (RapidAPI)",
    logo: "🏟️",
    category: "sports" as const,
    url: "https://rapidapi.com/api-sports/api/api-football",
    description: "Jogos, resultados, classificações, eventos ao vivo de futebol",
    keyLabel: "X-RapidAPI-Key",
    secretLabel: "",
    baseUrl: "https://api-football-v1.p.rapidapi.com/v3",
    usageTypes: ["live_streams", "game_events", "game_data", "statistics", "competitions"],
  },
  {
    id: "sportradar",
    label: "Sportradar",
    logo: "📡",
    category: "sports" as const,
    url: "https://developer.sportradar.com",
    description: "Dados desportivos em tempo real — futebol, basquete, ténis, NFL, MLB",
    keyLabel: "API Key",
    secretLabel: "",
    baseUrl: "https://api.sportradar.com",
    usageTypes: ["live_streams", "game_events", "game_data", "statistics"],
  },
  {
    id: "thesportsdb",
    label: "TheSportsDB",
    logo: "🏅",
    category: "sports" as const,
    url: "https://www.thesportsdb.com/api.php",
    description: "Base de dados desportiva — ligas, equipas, jogadores, logos",
    keyLabel: "API Key",
    secretLabel: "",
    baseUrl: "https://www.thesportsdb.com/api/v1/json",
    usageTypes: ["competitions", "teams", "players", "shields"],
  },
  {
    id: "football_data",
    label: "Football-Data.org",
    logo: "⚽",
    category: "sports" as const,
    url: "https://www.football-data.org",
    description: "API gratuita de futebol — ligas europeias, Copa do Mundo",
    keyLabel: "X-Auth-Token",
    secretLabel: "",
    baseUrl: "https://api.football-data.org/v4",
    usageTypes: ["game_events", "competitions", "standings"],
  },
  {
    id: "streamm3u",
    label: "StreamM3U / IPTV Provider",
    logo: "📺",
    category: "live" as const,
    url: "",
    description: "Fornecedor de streams M3U8 para transmissões ao vivo",
    keyLabel: "Username / Key",
    secretLabel: "Password / Secret",
    baseUrl: "",
    usageTypes: ["live_streams"],
  },
  {
    id: "cloudflare_stream",
    label: "Cloudflare Stream",
    logo: "☁️",
    category: "live" as const,
    url: "https://developers.cloudflare.com/stream",
    description: "Hosting e CDN de vídeos e streams ao vivo",
    keyLabel: "API Token",
    secretLabel: "Account ID",
    baseUrl: "https://api.cloudflare.com/client/v4",
    usageTypes: ["live_streams"],
  },
  {
    id: "mux",
    label: "Mux Video",
    logo: "▶️",
    category: "live" as const,
    url: "https://mux.com",
    description: "Plataforma de vídeo e streaming ao vivo escalável",
    keyLabel: "Access Token ID",
    secretLabel: "Secret Key",
    baseUrl: "https://api.mux.com",
    usageTypes: ["live_streams"],
  },
  {
    id: "custom",
    label: "Provedor Personalizado",
    logo: "🔧",
    category: "other" as const,
    url: "",
    description: "Configure manualmente qualquer API ou endpoint",
    keyLabel: "API Key / Token",
    secretLabel: "Secret (opcional)",
    baseUrl: "",
    usageTypes: [],
  },
];

const CATEGORY_META = {
  sports:  { label: "Dados Desportivos", color: "#22C55E", icon: Trophy },
  live:    { label: "Streaming / Live",  color: "#E50914", icon: Tv2 },
  results: { label: "Resultados",        color: "#E50914", icon: BarChart3 },
  media:   { label: "Media / CDN",       color: "#8B5CF6", icon: Cloud },
  other:   { label: "Outros",            color: "#6B7280", icon: Zap },
};

const USAGE_TYPES = [
  { value: "live_streams", label: "Live Streams" },
  { value: "game_events", label: "Eventos dos Jogos" },
  { value: "game_data", label: "Dados dos Jogos" },
  { value: "statistics", label: "Estatísticas" },
  { value: "competitions", label: "Competições" },
  { value: "teams", label: "Equipas" },
  { value: "players", label: "Jogadores" },
  { value: "shields", label: "Escudos" },
  { value: "standings", label: "Classificações" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ApiKeyRequiredModalProps {
  /** Context label shown in the header, e.g. "Importar Streams" */
  context?: string;
  /** Which provider is suggested first (by id) */
  suggestedProvider?: string;
  onClose: () => void;
  /** Called after a key is successfully saved */
  onKeySaved?: () => void;
}

type Step = "info" | "provider" | "configure";

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ApiKeyRequiredModal({
  context = "esta funcionalidade",
  suggestedProvider,
  onClose,
  onKeySaved,
}: ApiKeyRequiredModalProps) {
  const [step, setStep] = useState<Step>("info");
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState<typeof PROVIDER_CATALOGUE[0] | null>(
    suggestedProvider ? (PROVIDER_CATALOGUE.find((p) => p.id === suggestedProvider) ?? null) : null
  );
  const [form, setForm] = useState({ name: "", keyValue: "", secretValue: "", baseUrl: "" });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelectProvider = (p: typeof PROVIDER_CATALOGUE[0]) => {
    setSelected(p);
    setForm({ name: p.label, keyValue: "", secretValue: "", baseUrl: p.baseUrl });
    setStep("configure");
  };

  const handleSave = async () => {
    if (!selected || !form.keyValue.trim()) {
      toast.error("Preencha a chave de API.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/api-keys", {
        method: "POST",
        body: JSON.stringify({
          name: form.name || selected.label,
          provider: selected.id,
          keyValue: form.keyValue.trim(),
          baseUrl: form.baseUrl.trim() || null,
          description: selected.description,
          status: "active",
          priority: 1,
          usageTypes: selected.usageTypes,
          requestLimit: null,
          expiresAt: null,
        }),
      });
      toast.success("API Key guardada! Pode agora repetir a sincronização.");
      onKeySaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar a chave.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = PROVIDER_CATALOGUE.filter((p) => catFilter === "all" || p.category === catFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E1E2A] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Key className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-white">API Key Necessária</h3>
              <p className="text-[11px] text-gray-500">
                {step === "info" && `Configure uma chave para ${context}`}
                {step === "provider" && "Escolha o provedor de API"}
                {step === "configure" && `Configurar: ${selected?.label}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── STEP: INFO ── */}
        {step === "info" && (
          <div className="p-5 space-y-4">
            <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                Para usar <strong className="text-amber-200">{context}</strong> é necessário ter pelo menos uma API Key configurada.
                Configure agora ou aceda à gestão completa de API Keys.
              </p>
            </div>

            <div className="grid gap-2">
              <button
                onClick={() => setStep("provider")}
                className="group flex items-center justify-between gap-4 rounded-xl border border-[#E50914]/20 bg-[#E50914]/5 p-4 hover:border-[#E50914]/40 hover:bg-[#E50914]/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E50914]/15 border border-[#E50914]/20">
                    <Key className="h-4 w-4 text-[#E50914]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Adicionar API Key agora</p>
                    <p className="text-[11px] text-gray-400">Escolha um provedor e insira a chave</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#E50914] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <Link
                href="/admin/api-keys"
                onClick={onClose}
                className="group flex items-center justify-between gap-4 rounded-xl border border-[#1E1E2A] bg-[#111118] p-4 hover:border-[#2A2A38] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1A24] border border-[#1E1E2A]">
                    <Shield className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Gestão completa de API Keys</p>
                    <p className="text-[11px] text-gray-400">Prioridades, limites, tipos de utilização</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP: PROVIDER ── */}
        {step === "provider" && (
          <div className="p-5 space-y-3">
            <button onClick={() => setStep("info")} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
              ← Voltar
            </button>

            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap">
              {[["all", "Todos"], ...Object.entries(CATEGORY_META).map(([k, v]) => [k, v.label])].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setCatFilter(k)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${catFilter === k ? "bg-[#E50914] text-white" : "bg-[#111118] text-gray-400 border border-[#1E1E2A] hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filtered.map((provider) => {
                const meta = CATEGORY_META[provider.category as keyof typeof CATEGORY_META];
                const CatIcon = meta.icon;
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#1E1E2A] bg-[#111118] hover:border-[#E50914]/30 hover:bg-[#1A1A24] transition-all text-left group"
                  >
                    <span className="text-xl flex-shrink-0">{provider.logo}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{provider.label}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ color: meta.color, background: `${meta.color}15` }}>
                          <CatIcon className="h-2 w-2" /> {meta.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{provider.description}</p>
                    </div>
                    {provider.url && <ExternalLink className="h-3 w-3 text-gray-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP: CONFIGURE ── */}
        {step === "configure" && selected && (
          <div className="p-5 space-y-4">
            <button onClick={() => setStep("provider")} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
              ← Escolher outro provedor
            </button>

            {selected.url && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/20 px-3 py-2.5">
                <Info className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">
                  Obtenha a sua chave em{" "}
                  <a href={selected.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">
                    {selected.url}
                  </a>
                </p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">Nome / Etiqueta</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={selected.label}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">{selected.keyLabel} *</label>
              <p className="text-[10px] text-gray-600 mb-1">Nunca partilhe esta chave publicamente</p>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={form.keyValue}
                  onChange={(e) => setForm({ ...form, keyValue: e.target.value })}
                  placeholder="sk-••••••••••••••••"
                  className="input-dark w-full px-3 py-2.5 pr-10 text-sm font-mono"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {selected.secretLabel && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">{selected.secretLabel}</label>
                <input
                  type="password"
                  value={form.secretValue}
                  onChange={(e) => setForm({ ...form, secretValue: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="input-dark w-full px-3 py-2.5 text-sm font-mono"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">URL Base</label>
              <input
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="input-dark w-full px-3 py-2.5 text-sm font-mono"
              />
            </div>

            {/* Types preview */}
            {selected.usageTypes.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Tipos de utilização configurados automaticamente:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.usageTypes.map((t) => (
                    <span key={t} className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-semibold text-red-300">
                      {USAGE_TYPES.find((u) => u.value === t)?.label || t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-[#1E1E2A]">
              <button onClick={onClose} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.keyValue.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "A guardar..." : (
                  <><CheckCircle className="h-4 w-4" /> Guardar e Continuar</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
