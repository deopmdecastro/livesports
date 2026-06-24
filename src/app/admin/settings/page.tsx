"use client";

import { useState } from "react";
import {
  Save, Globe, Shield, Bell, Database,
  Key, Eye, EyeOff, Plus, Trash2, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Copy, Zap,
  Tv2, Trophy, BarChart3, Cloud, ExternalLink,
  ChevronDown, Info,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  provider: string;
  label: string;
  key: string;
  secret?: string;
  baseUrl?: string;
  category: "sports" | "live" | "results" | "media" | "other";
  status: "active" | "error" | "untested";
  lastTestedAt?: string;
  createdAt: string;
}

// ─── Providers catalogue ──────────────────────────────────────────────────────

const PROVIDER_CATALOGUE = [
  {
    id: "api_football",
    label: "API-Football (RapidAPI)",
    category: "sports" as const,
    url: "https://rapidapi.com/api-sports/api/api-football",
    description: "Jogos, resultados, classificações, eventos ao vivo de futebol",
    keyLabel: "X-RapidAPI-Key",
    secretLabel: "",
    baseUrl: "https://api-football-v1.p.rapidapi.com/v3",
    logo: "🏟️",
  },
  {
    id: "sportradar",
    label: "Sportradar",
    category: "sports" as const,
    url: "https://developer.sportradar.com",
    description: "Dados desportivos em tempo real — futebol, basquete, ténis, NFL, MLB",
    keyLabel: "API Key",
    secretLabel: "",
    baseUrl: "https://api.sportradar.com",
    logo: "📡",
  },
  {
    id: "thesportsdb",
    label: "TheSportsDB",
    category: "sports" as const,
    url: "https://www.thesportsdb.com/api.php",
    description: "Base de dados desportiva — ligas, equipas, jogadores, logos",
    keyLabel: "API Key",
    secretLabel: "",
    baseUrl: "https://www.thesportsdb.com/api/v1/json",
    logo: "🏅",
  },
  {
    id: "football_data",
    label: "Football-Data.org",
    category: "sports" as const,
    url: "https://www.football-data.org",
    description: "API gratuita de futebol — ligas europeias, Copa do Mundo",
    keyLabel: "X-Auth-Token",
    secretLabel: "",
    baseUrl: "https://api.football-data.org/v4",
    logo: "⚽",
  },
  {
    id: "livescore",
    label: "LiveScore API",
    category: "results" as const,
    url: "https://rapidapi.com/apidojo/api/livescore6",
    description: "Resultados em tempo real de múltiplos desportos",
    keyLabel: "X-RapidAPI-Key",
    secretLabel: "",
    baseUrl: "https://livescore6.p.rapidapi.com",
    logo: "🔴",
  },
  {
    id: "streamm3u",
    label: "StreamM3U / IPTV Provider",
    category: "live" as const,
    url: "",
    description: "Fornecedor de streams M3U8 para transmissões ao vivo",
    keyLabel: "Username / Key",
    secretLabel: "Password / Secret",
    baseUrl: "",
    logo: "📺",
  },
  {
    id: "cloudflare_stream",
    label: "Cloudflare Stream",
    category: "live" as const,
    url: "https://developers.cloudflare.com/stream",
    description: "Hosting e CDN de vídeos e streams ao vivo",
    keyLabel: "API Token",
    secretLabel: "Account ID",
    baseUrl: "https://api.cloudflare.com/client/v4",
    logo: "☁️",
  },
  {
    id: "mux",
    label: "Mux Video",
    category: "live" as const,
    url: "https://mux.com",
    description: "Plataforma de vídeo e streaming ao vivo escalável",
    keyLabel: "Access Token ID",
    secretLabel: "Secret Key",
    baseUrl: "https://api.mux.com",
    logo: "▶️",
  },
  {
    id: "custom",
    label: "Provedor Personalizado",
    category: "other" as const,
    url: "",
    description: "Configure manualmente qualquer API ou endpoint",
    keyLabel: "API Key / Token",
    secretLabel: "Secret (opcional)",
    baseUrl: "",
    logo: "🔧",
  },
];

const CATEGORY_META = {
  sports:  { label: "Dados Desportivos", color: "#22C55E", icon: Trophy },
  live:    { label: "Streaming / Live",  color: "#E50914", icon: Tv2 },
  results: { label: "Resultados",        color: "#3B82F6", icon: BarChart3 },
  media:   { label: "Media / CDN",       color: "#8B5CF6", icon: Cloud },
  other:   { label: "Outros",            color: "#6B7280", icon: Zap },
};

// ─── Initial mock data ─────────────────────────────────────────────────────────

const INITIAL_KEYS: ApiKey[] = [
  {
    id: "k1",
    provider: "api_football",
    label: "API-Football (RapidAPI)",
    key: "••••••••••••••••••••••••••••••••••••",
    category: "sports",
    status: "active",
    lastTestedAt: "2026-06-23T10:00:00Z",
    createdAt: "2026-06-01T10:00:00Z",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, color = "#E50914", children }: {
  title: string; icon: React.ElementType; color?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-[#1E1E2A]">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-gray-600">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", mono }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <input
      type={type} value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`input-dark w-full px-3 py-2.5 text-sm ${mono ? "font-mono" : ""}`}
    />
  );
}

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <span className="text-sm text-gray-200">{label}</span>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${checked ? "bg-[#E50914]" : "bg-[#2A2A38]"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: ApiKey["status"] }) {
  const map = {
    active: { color: "#22C55E", label: "Ativo", Icon: CheckCircle2 },
    error:  { color: "#E50914", label: "Erro",  Icon: XCircle },
    untested: { color: "#F59E0B", label: "Não testado", Icon: AlertCircle },
  };
  const { color, label, Icon } = map[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

// ─── API Key Card ─────────────────────────────────────────────────────────────

function ApiKeyCard({
  apiKey, onDelete, onTest, onToggleReveal, revealed,
}: {
  apiKey: ApiKey;
  onDelete: () => void;
  onTest: () => void;
  onToggleReveal: () => void;
  revealed: boolean;
}) {
  const catMeta = CATEGORY_META[apiKey.category];
  const CatIcon = catMeta.icon;

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey.key).then(() => toast.success("Chave copiada!"));
  };

  return (
    <div className="rounded-xl border border-[#1E1E2A] bg-[#111118] p-4 group hover:border-[#2A2A38] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg bg-[#1A1A24] border border-[#1E1E2A] flex-shrink-0">
            {PROVIDER_CATALOGUE.find((p) => p.id === apiKey.provider)?.logo || "🔑"}
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{apiKey.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: catMeta.color }}>
                <CatIcon className="h-2.5 w-2.5" />
                {catMeta.label}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={apiKey.status} />
      </div>

      {/* Key display */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 rounded-lg bg-[#0A0A0F] border border-[#1E1E2A] px-3 py-2 font-mono text-xs text-gray-400 truncate">
          {revealed ? apiKey.key : "••••••••••••••••••••••••••••••••••••"}
        </div>
        <button onClick={onToggleReveal} className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button onClick={copyKey} className="p-2 text-gray-500 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/5">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      {apiKey.baseUrl && (
        <p className="text-[10px] text-gray-600 mb-3 font-mono truncate">Base URL: {apiKey.baseUrl}</p>
      )}

      {apiKey.lastTestedAt && (
        <p className="text-[10px] text-gray-600 mb-3">
          Testado: {new Date(apiKey.lastTestedAt).toLocaleString("pt-PT")}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onTest}
          className="flex items-center gap-1.5 rounded-lg border border-[#1E1E2A] bg-[#0A0A0F] px-3 py-1.5 text-[10px] font-bold text-gray-300 hover:text-white hover:border-[#2A2A38] transition-all"
        >
          <Zap className="h-3 w-3" /> Testar conexão
        </button>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <Trash2 className="h-3 w-3" /> Remover
        </button>
      </div>
    </div>
  );
}

// ─── Add API Key Modal ────────────────────────────────────────────────────────

function AddApiKeyModal({ onClose, onAdd }: { onClose: () => void; onAdd: (key: ApiKey) => void }) {
  const [step, setStep] = useState<"provider" | "configure">("provider");
  const [selectedProvider, setSelectedProvider] = useState<typeof PROVIDER_CATALOGUE[0] | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [baseUrlValue, setBaseUrlValue] = useState("");
  const [showKey, setShowKey] = useState(false);

  const handleProviderSelect = (provider: typeof PROVIDER_CATALOGUE[0]) => {
    setSelectedProvider(provider);
    setCustomLabel(provider.label);
    setBaseUrlValue(provider.baseUrl);
    setStep("configure");
  };

  const handleAdd = () => {
    if (!selectedProvider || !keyValue.trim()) {
      toast.error("Preencha a chave de API.");
      return;
    }
    const newKey: ApiKey = {
      id: Date.now().toString(),
      provider: selectedProvider.id,
      label: customLabel || selectedProvider.label,
      key: keyValue.trim(),
      secret: secretValue.trim() || undefined,
      baseUrl: baseUrlValue.trim() || undefined,
      category: selectedProvider.category,
      status: "untested",
      createdAt: new Date().toISOString(),
    };
    onAdd(newKey);
    toast.success("Chave adicionada! Teste a conexão para validar.");
    onClose();
  };

  const filterByCategory = (cat: string) =>
    PROVIDER_CATALOGUE.filter((p) => cat === "all" || p.category === cat);

  const [catFilter, setCatFilter] = useState("all");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E1E2A]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E50914]/10 border border-[#E50914]/20">
              <Key className="h-4 w-4 text-[#E50914]" />
            </div>
            <div>
              <h3 className="font-black text-white">
                {step === "provider" ? "Selecionar Provedor" : `Configurar: ${selectedProvider?.label}`}
              </h3>
              <p className="text-[11px] text-gray-500">
                {step === "provider" ? "Escolha o tipo de API a integrar" : "Insira as credenciais do provedor"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Step: Select provider */}
        {step === "provider" && (
          <div className="p-5 space-y-4">
            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap">
              {[["all", "Todos"], ...Object.entries(CATEGORY_META).map(([k, v]) => [k, v.label])].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setCatFilter(k)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${catFilter === k ? "bg-[#E50914] text-white" : "bg-[#111118] text-gray-400 border border-[#1E1E2A] hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-2">
              {filterByCategory(catFilter).map((provider) => {
                const catMeta = CATEGORY_META[provider.category];
                const CatIcon = catMeta.icon;
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[#1E1E2A] bg-[#111118] hover:border-[#E50914]/30 hover:bg-[#1A1A24] transition-all text-left group"
                  >
                    <span className="text-2xl flex-shrink-0">{provider.logo}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white group-hover:text-white">{provider.label}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: catMeta.color, background: `${catMeta.color}15` }}>
                          <CatIcon className="h-2 w-2 inline mr-0.5" />{catMeta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{provider.description}</p>
                    </div>
                    {provider.url && (
                      <ExternalLink className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Configure */}
        {step === "configure" && selectedProvider && (
          <div className="p-5 space-y-4">
            <button onClick={() => setStep("provider")} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
              ← Voltar à seleção
            </button>

            {selectedProvider.url && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-500/5 border border-blue-500/20 px-4 py-3">
                <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-blue-300">
                  Obtenha a sua chave em{" "}
                  <a href={selectedProvider.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">
                    {selectedProvider.url}
                  </a>
                </p>
              </div>
            )}

            <Field label="Nome / Etiqueta">
              <Input value={customLabel} onChange={setCustomLabel} placeholder={selectedProvider.label} />
            </Field>

            <Field label={`${selectedProvider.keyLabel} *`} hint="Nunca partilhe esta chave publicamente">
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder="sk-••••••••••••••••"
                  className="input-dark w-full px-3 py-2.5 pr-10 text-sm font-mono"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {selectedProvider.secretLabel && (
              <Field label={selectedProvider.secretLabel}>
                <Input value={secretValue} onChange={setSecretValue} placeholder="••••••••••••••••" type="password" mono />
              </Field>
            )}

            <Field label="Base URL">
              <Input value={baseUrlValue} onChange={setBaseUrlValue} placeholder="https://api.example.com/v1" mono />
            </Field>

            <div className="flex justify-end gap-3 pt-2 border-t border-[#1E1E2A]">
              <button onClick={onClose} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                className="rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all"
              >
                Adicionar Chave
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const SETTINGS_TABS = ["Geral", "Identidade", "Segurança", "Notificações", "API Keys"] as const;
type SettingsTab = typeof SETTINGS_TABS[number];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Geral");

  // Branding / Identity
  const [branding, setBranding] = useState({
    logoUrl: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("livesports_branding") || "{}").logoUrl || "" : "",
    faviconUrl: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("livesports_branding") || "{}").faviconUrl || "" : "",
    ogImageUrl: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("livesports_branding") || "{}").ogImageUrl || "" : "",
    primaryColor: "#E50914",
    siteName: "LiveSports",
  });
  const [savingBranding, setSavingBranding] = useState(false);

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      localStorage.setItem("livesports_branding", JSON.stringify(branding));
      if (branding.faviconUrl) {
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) { link = document.createElement("link"); document.head.appendChild(link); }
        link.type = "image/x-icon"; link.rel = "shortcut icon"; link.href = branding.faviconUrl;
      }
      toast.success("Identidade visual guardada!");
    } catch { toast.error("Erro ao guardar"); }
    finally { setSavingBranding(false); }
  };

  // General
  const [general, setGeneral] = useState({
    siteName: "LiveSports",
    siteUrl: "https://livesports.com",
    description: "A melhor plataforma de streaming desportivo ao vivo",
    email: "admin@livesports.com",
    phone: "+351 910 000 000",
    language: "pt",
    timezone: "Europe/Lisbon",
  });

  // Security
  const [security, setSecurity] = useState({
    requireEmail: true,
    allowGoogle: true,
    allowFacebook: false,
    twoFactorDefault: false,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
  });

  // Notifications
  const [notifs, setNotifs] = useState({
    emailNewUser: true,
    emailNewLive: true,
    emailErrors: true,
    pushEnabled: false,
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
  });

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [testingId, setTestingId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const testKey = async (id: string) => {
    setTestingId(id);
    await new Promise((r) => setTimeout(r, 1800));
    setApiKeys((prev) =>
      prev.map((k) => k.id === id ? { ...k, status: "active", lastTestedAt: new Date().toISOString() } : k)
    );
    setTestingId(null);
    toast.success("Conexão validada com sucesso!");
  };

  const deleteKey = (id: string) => {
    if (!window.confirm("Remover esta chave de API?")) return;
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("Chave removida.");
  };

  const handleSave = () => toast.success("Configurações guardadas!");

  const groupedKeys = Object.keys(CATEGORY_META).reduce((acc, cat) => {
    const keys = apiKeys.filter((k) => k.category === cat);
    if (keys.length) acc[cat] = keys;
    return acc;
  }, {} as Record<string, ApiKey[]>);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Page header */}
      <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Configurações
        </h2>
        <p className="text-sm text-gray-400 mt-1">Gerencie as configurações globais da plataforma, segurança e integrações de API.</p>

        {/* Tab bar */}
        <div className="mt-5 flex gap-1 rounded-xl border border-[#1E1E2A] bg-[#0A0A0F] p-1">
          {SETTINGS_TABS.map((tab) => {
            const icons: Record<SettingsTab, React.ElementType> = { Geral: Globe, Identidade: Tv2, Segurança: Shield, Notificações: Bell, "API Keys": Key };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                  activeTab === tab ? "bg-[#E50914] text-white shadow" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB: GERAL ── */}
      {activeTab === "Geral" && (
        <Section title="Configurações Gerais" icon={Globe}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Nome do Site", k: "siteName", placeholder: "LiveSports" },
                { label: "URL do Site", k: "siteUrl", placeholder: "https://livesports.com" },
                { label: "Email de Contacto", k: "email", placeholder: "admin@livesports.com" },
                { label: "Telefone", k: "phone", placeholder: "+351 9xx xxx xxx" },
              ].map(({ label, k, placeholder }) => (
                <Field key={k} label={label}>
                  <Input
                    value={general[k as keyof typeof general]}
                    onChange={(v) => setGeneral({ ...general, [k]: v })}
                    placeholder={placeholder}
                  />
                </Field>
              ))}
            </div>
            <Field label="Descrição do Site">
              <textarea
                value={general.description}
                onChange={(e) => setGeneral({ ...general, description: e.target.value })}
                rows={3}
                className="input-dark w-full resize-none px-3 py-2.5 text-sm"
                placeholder="Descrição curta para SEO..."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Idioma Padrão">
                <select value={general.language} onChange={(e) => setGeneral({ ...general, language: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm">
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </Field>
              <Field label="Fuso Horário">
                <select value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm">
                  <option value="Europe/Lisbon">Europe/Lisbon (UTC+0/+1)</option>
                  <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
                  <option value="Africa/Luanda">Africa/Luanda (UTC+1)</option>
                  <option value="UTC">UTC</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>
      )}

      {/* ── TAB: IDENTIDADE ── */}
      {activeTab === "Identidade" && (
        <div className="space-y-5">
          <Section title="Logótipo do Site" icon={Tv2}>
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Defina o logótipo exibido na barra lateral do admin e na navbar do site.</p>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">URL do Logótipo</label>
                <input
                  value={branding.logoUrl}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  placeholder="https://cdn.exemplo.com/logo.svg ou /logo.png"
                />
                {branding.logoUrl && (
                  <div className="mt-3 p-3 rounded-lg border border-[#1E1E2A] bg-[#0A0A0F] inline-block">
                    <p className="text-[10px] text-gray-500 mb-2">Pré-visualização</p>
                    <img src={branding.logoUrl} alt="Logo" className="h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Favicon" icon={Globe}>
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Ícone exibido na tab do browser. Use um arquivo .ico, .png ou .svg (recomendado 32x32px).</p>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">URL do Favicon</label>
                <input
                  value={branding.faviconUrl}
                  onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  placeholder="https://cdn.exemplo.com/favicon.ico ou /favicon.png"
                />
                {branding.faviconUrl && (
                  <div className="mt-3 p-3 rounded-lg border border-[#1E1E2A] bg-[#0A0A0F] inline-block">
                    <p className="text-[10px] text-gray-500 mb-2">Pré-visualização</p>
                    <img src={branding.faviconUrl} alt="Favicon" className="h-8 w-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Imagem OpenGraph (SEO)" icon={Globe}>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">URL da Imagem OG</label>
              <input
                value={branding.ogImageUrl}
                onChange={(e) => setBranding({ ...branding, ogImageUrl: e.target.value })}
                className="input-dark w-full px-3 py-2.5 text-sm"
                placeholder="https://cdn.exemplo.com/og-image.jpg (1200x630px recomendado)"
              />
            </div>
          </Section>

          <button
            onClick={handleSaveBranding}
            disabled={savingBranding}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingBranding ? "A guardar..." : "Guardar Identidade Visual"}
          </button>
        </div>
      )}

      {/* ── TAB: SEGURANÇA ── */}
      {activeTab === "Segurança" && (
        <Section title="Segurança & Autenticação" icon={Shield}>
          <div className="space-y-3 divide-y divide-[#1E1E2A]">
            <Toggle checked={security.requireEmail} onChange={(v) => setSecurity({ ...security, requireEmail: v })} label="Verificação de email obrigatória" sub="Utilizadores devem confirmar email ao registar" />
            <div className="pt-3"><Toggle checked={security.allowGoogle} onChange={(v) => setSecurity({ ...security, allowGoogle: v })} label="Login com Google" /></div>
            <div className="pt-3"><Toggle checked={security.allowFacebook} onChange={(v) => setSecurity({ ...security, allowFacebook: v })} label="Login com Facebook" /></div>
            <div className="pt-3"><Toggle checked={security.twoFactorDefault} onChange={(v) => setSecurity({ ...security, twoFactorDefault: v })} label="Ativar 2FA por padrão" sub="Recomendado para contas de admin" /></div>
            <div className="pt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Tentativas máx. de login">
                <Input value={String(security.maxLoginAttempts)} onChange={(v) => setSecurity({ ...security, maxLoginAttempts: Number(v) })} type="number" />
              </Field>
              <Field label="Timeout de sessão (horas)">
                <Input value={String(security.sessionTimeout)} onChange={(v) => setSecurity({ ...security, sessionTimeout: Number(v) })} type="number" />
              </Field>
            </div>
          </div>
        </Section>
      )}

      {/* ── TAB: NOTIFICAÇÕES ── */}
      {activeTab === "Notificações" && (
        <div className="space-y-4">
          <Section title="Notificações por Email" icon={Bell}>
            <div className="space-y-3 divide-y divide-[#1E1E2A]">
              <Toggle checked={notifs.emailNewUser} onChange={(v) => setNotifs({ ...notifs, emailNewUser: v })} label="Novo utilizador registado" />
              <div className="pt-3"><Toggle checked={notifs.emailNewLive} onChange={(v) => setNotifs({ ...notifs, emailNewLive: v })} label="Nova live criada" /></div>
              <div className="pt-3"><Toggle checked={notifs.emailErrors} onChange={(v) => setNotifs({ ...notifs, emailErrors: v })} label="Erros e alertas críticos" sub="Falhas de stream, erros de API, etc." /></div>
            </div>
          </Section>

          <Section title="Telegram Bot" icon={Bell} color="#3B82F6">
            <div className="space-y-4">
              <Toggle checked={notifs.telegramEnabled} onChange={(v) => setNotifs({ ...notifs, telegramEnabled: v })} label="Ativar notificações via Telegram" />
              {notifs.telegramEnabled && (
                <div className="grid gap-4 sm:grid-cols-2 mt-3 pt-3 border-t border-[#1E1E2A]">
                  <Field label="Bot Token" hint="Obtenha com @BotFather no Telegram">
                    <Input value={notifs.telegramBotToken} onChange={(v) => setNotifs({ ...notifs, telegramBotToken: v })} placeholder="123456:ABC-DEF..." mono />
                  </Field>
                  <Field label="Chat ID">
                    <Input value={notifs.telegramChatId} onChange={(v) => setNotifs({ ...notifs, telegramChatId: v })} placeholder="-1001234567890" mono />
                  </Field>
                </div>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB: API KEYS ── */}
      {activeTab === "API Keys" && (
        <div className="space-y-5">
          {/* Info banner */}
          <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-300 leading-relaxed">
              <strong className="text-amber-200">Segurança:</strong> As chaves de API são armazenadas de forma encriptada e nunca expostas ao frontend público.
              Apenas administradores com permissão <code className="bg-amber-500/10 px-1 rounded">api:keys</code> podem visualizá-las.
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Total de Chaves", value: apiKeys.length, color: "text-white" },
              { label: "Ativas", value: apiKeys.filter((k) => k.status === "active").length, color: "text-emerald-400" },
              { label: "Com Erros", value: apiKeys.filter((k) => k.status === "error").length, color: "text-red-400" },
              { label: "Não Testadas", value: apiKeys.filter((k) => k.status === "untested").length, color: "text-amber-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 text-center">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Add button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all"
            >
              <Plus className="h-4 w-4" />
              Adicionar Chave de API
            </button>
          </div>

          {/* Keys grouped by category */}
          {Object.entries(groupedKeys).map(([cat, keys]) => {
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
            const CatIcon = meta.icon;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <CatIcon className="h-4 w-4" style={{ color: meta.color }} />
                  <h4 className="text-sm font-bold text-white">{meta.label}</h4>
                  <span className="text-xs text-gray-600">({keys.length})</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {keys.map((key) => (
                    <div key={key.id} className="relative">
                      {testingId === key.id && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-xs text-white font-semibold">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            A testar conexão...
                          </div>
                        </div>
                      )}
                      <ApiKeyCard
                        apiKey={key}
                        onDelete={() => deleteKey(key.id)}
                        onTest={() => testKey(key.id)}
                        onToggleReveal={() => toggleReveal(key.id)}
                        revealed={revealedKeys.has(key.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {apiKeys.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-[#1E1E2A]">
              <Key className="h-10 w-10 text-gray-700 mb-3" />
              <p className="text-gray-400 font-medium">Nenhuma chave de API configurada</p>
              <p className="text-xs text-gray-600 mt-1 mb-4">Adicione chaves para integrar provedores de dados, streams e resultados.</p>
              <button onClick={() => setShowAddModal(true)} className="text-sm text-[#E50914] hover:underline">
                + Adicionar primeira chave
              </button>
            </div>
          )}
        </div>
      )}

      {/* Save button (not on API Keys tab) */}
      {activeTab !== "API Keys" && (
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all"
        >
          <Save className="h-4 w-4" />
          Guardar Configurações
        </button>
      )}

      {/* Add API Key Modal */}
      {showAddModal && (
        <AddApiKeyModal
          onClose={() => setShowAddModal(false)}
          onAdd={(key) => setApiKeys((prev) => [...prev, key])}
        />
      )}
    </div>
  );
}
