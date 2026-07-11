"use client";

import { useEffect, useState } from "react";
import {
  Key, Plus, Edit2, Trash2, RefreshCw, CheckCircle, XCircle, Eye, EyeOff,
  Globe, Info, ExternalLink, ArrowLeft, Wifi, WifiOff, Loader2,
  Trophy, Tv2, BarChart3, Cloud, Zap, Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const USAGE_TYPES = [
  { value: "live_streams", label: "Live Streams" },
  { value: "game_events", label: "Eventos dos Jogos" },
  { value: "game_data", label: "Dados dos Jogos" },
  { value: "statistics", label: "Estatísticas" },
  { value: "competitions", label: "Competições" },
  { value: "teams", label: "Equipas" },
  { value: "players", label: "Jogadores" },
  { value: "shields", label: "Escudos" },
  { value: "logos", label: "Logótipos" },
  { value: "flags", label: "Bandeiras" },
  { value: "standings", label: "Classificações" },
  { value: "odds", label: "Odds" },
  { value: "news", label: "Notícias" },
];

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
    defaultUsageTypes: ["live_streams", "game_events", "game_data", "statistics", "competitions"],
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
    defaultUsageTypes: ["live_streams", "game_events", "game_data", "statistics"],
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
    defaultUsageTypes: ["competitions", "teams", "players", "shields", "logos"],
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
    defaultUsageTypes: ["game_events", "competitions", "standings"],
  },
  {
    id: "livescore",
    label: "LiveScore API",
    logo: "🔴",
    category: "results" as const,
    url: "https://rapidapi.com/apidojo/api/livescore6",
    description: "Resultados em tempo real de múltiplos desportos",
    keyLabel: "X-RapidAPI-Key",
    secretLabel: "",
    baseUrl: "https://livescore6.p.rapidapi.com",
    defaultUsageTypes: ["game_events", "standings"],
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
    defaultUsageTypes: ["live_streams"],
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
    defaultUsageTypes: ["live_streams"],
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
    defaultUsageTypes: ["live_streams"],
  },
  {
    id: "newsdata",
    label: "NewsData.io",
    logo: "📰",
    category: "news" as const,
    url: "https://newsdata.io/documentation",
    description: "Noticias desportivas em tempo real, em Portugues e Ingles, para o blog",
    keyLabel: "apikey",
    secretLabel: "",
    baseUrl: "https://newsdata.io/api/1",
    defaultUsageTypes: ["news"],
  },
  {
    id: "newsapi",
    label: "NewsAPI.org",
    logo: "🗞️",
    category: "news" as const,
    url: "https://newsapi.org/docs",
    description: "Manchetes desportivas (top-headlines, categoria fixa em sports)",
    keyLabel: "X-Api-Key",
    secretLabel: "",
    baseUrl: "https://newsapi.org/v2",
    defaultUsageTypes: ["news"],
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
    defaultUsageTypes: [],
  },
];

const CATEGORY_META = {
  sports:  { label: "Dados Desportivos", color: "#22C55E", icon: Trophy },
  live:    { label: "Streaming / Live",  color: "#E50914", icon: Tv2 },
  results: { label: "Resultados",        color: "#E50914", icon: BarChart3 },
  news:    { label: "Noticias / Blog",   color: "#F59E0B", icon: Globe },
  media:   { label: "Media / CDN",       color: "#8B5CF6", icon: Cloud },
  other:   { label: "Outros",            color: "#6B7280", icon: Zap },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  provider: string;
  baseUrl?: string;
  keyValue?: string;
  status: "active" | "inactive" | "expired";
  priority: number;
  requestLimit?: number;
  requestsUsed: number;
  errorCount: number;
  lastUsedAt?: string;
  lastSyncedAt?: string;
  expiresAt?: string;
  usageTypes: string[];
  createdAt: string;
}

interface TestResult {
  reachable: boolean;
  latencyMs: number | null;
  statusCode: number | null;
  message: string;
}

interface Discovery {
  envApis: Array<{
    key: string; name: string; provider: string; baseUrl: string;
    usageTypes: string[]; configured: boolean;
  }>;
  dbKeys: ApiKey[];
  importStats: { events: Record<string, number>; lives: Record<string, number> };
}

const emptyForm = {
  name: "", description: "", provider: "", baseUrl: "", keyValue: "", secretValue: "",
  status: "active", priority: 1, requestLimit: "", expiresAt: "", usageTypes: [] as string[],
};

type ModalStep = "provider" | "configure";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editKey, setEditKey] = useState<ApiKey | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [activeTab, setActiveTab] = useState<"keys" | "discovery">("keys");
  const [saving, setSaving] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("provider");
  const [catFilter, setCatFilter] = useState("all");

  // Test state: per-key id
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Set<string>>(new Set());

  // Env-backed API key edit modal
  const [envModalTarget, setEnvModalTarget] = useState<Discovery["envApis"][number] | null>(null);
  const [envKeyValue, setEnvKeyValue] = useState("");
  const [envShowValue, setEnvShowValue] = useState(false);
  const [envSaving, setEnvSaving] = useState(false);

  const load = async () => {
    try {
      const [keysData, discData] = await Promise.all([
        apiRequest<ApiKey[]>("/api-keys"),
        apiRequest<Discovery>("/api-keys/discovery"),
      ]);
      setKeys(keysData);
      setDiscovery(discData);
    } catch {
      toast.error("Erro ao carregar API Keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const testKey = async (id: string) => {
    setTesting((prev) => new Set(prev).add(id));
    try {
      const result = await apiRequest<TestResult>(`/api-keys/${id}/test`, { method: "POST" });
      setTestResults((prev) => ({ ...prev, [id]: result }));
      if (result.reachable) {
        toast.success(`Conectividade OK — ${result.latencyMs}ms`);
      } else {
        toast.error(result.message);
      }
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: { reachable: false, latencyMs: null, statusCode: null, message: "Erro ao testar" } }));
      toast.error("Erro ao testar conectividade");
    } finally {
      setTesting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const openCreate = () => {
    setEditKey(null);
    setForm({ ...emptyForm });
    setModalStep("provider");
    setCatFilter("all");
    setShowKeyValue(false);
    setModalOpen(true);
  };

  const openEdit = (key: ApiKey) => {
    setEditKey(key);
    setForm({
      name: key.name, description: key.description || "", provider: key.provider,
      baseUrl: key.baseUrl || "", keyValue: "", secretValue: "", status: key.status,
      priority: key.priority, requestLimit: key.requestLimit ? String(key.requestLimit) : "",
      expiresAt: key.expiresAt ? key.expiresAt.slice(0, 10) : "",
      usageTypes: [...key.usageTypes],
    });
    setModalStep("configure");
    setShowKeyValue(false);
    setModalOpen(true);
  };

  const handleProviderSelect = (provider: typeof PROVIDER_CATALOGUE[0]) => {
    setForm({
      ...emptyForm,
      name: provider.label,
      provider: provider.id,
      baseUrl: provider.baseUrl,
      usageTypes: provider.defaultUsageTypes,
    });
    setModalStep("configure");
  };

  const save = async () => {
    if (!form.name || !form.provider || (!editKey && !form.keyValue)) {
      toast.error("Nome, Provedor e Key são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        provider: form.provider,
        baseUrl: form.baseUrl || null,
        status: form.status,
        priority: Number(form.priority),
        requestLimit: form.requestLimit ? Number(form.requestLimit) : null,
        expiresAt: form.expiresAt || null,
        usageTypes: form.usageTypes,
      };
      if (form.keyValue) payload.keyValue = form.keyValue;
      if (form.secretValue) payload.secretValue = form.secretValue;

      if (editKey) {
        await apiRequest(`/api-keys/${editKey.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("API Key atualizada!");
      } else {
        await apiRequest("/api-keys", { method: "POST", body: JSON.stringify(payload) });
        toast.success("API Key criada!");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (key: ApiKey) => {
    const newStatus = key.status === "active" ? "inactive" : "active";
    try {
      await apiRequest(`/api-keys/${key.id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      setKeys((prev) => prev.map((k) => k.id === key.id ? { ...k, status: newStatus } : k));
      toast.success(`API Key ${newStatus === "active" ? "ativada" : "desativada"}!`);
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Remover esta API Key?")) return;
    try {
      await apiRequest(`/api-keys/${id}`, { method: "DELETE" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
      setTestResults((prev) => { const next = { ...prev }; delete next[id]; return next; });
      toast.success("API Key removida!");
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const openEnvEdit = (api: Discovery["envApis"][number]) => {
    setEnvModalTarget(api);
    setEnvKeyValue("");
    setEnvShowValue(false);
  };

  const saveEnvKey = async () => {
    if (!envModalTarget) return;
    if (!envKeyValue.trim()) {
      toast.error("Insere um valor para a chave");
      return;
    }
    setEnvSaving(true);
    try {
      await apiRequest(`/api-keys/env/${envModalTarget.key}`, {
        method: "PUT",
        body: JSON.stringify({ keyValue: envKeyValue.trim() }),
      });
      toast.success(`${envModalTarget.name} atualizada!`);
      setEnvModalTarget(null);
      setEnvKeyValue("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar chave");
    } finally {
      setEnvSaving(false);
    }
  };

  const toggleUsageType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      usageTypes: prev.usageTypes.includes(type)
        ? prev.usageTypes.filter((t) => t !== type)
        : [...prev.usageTypes, type],
    }));
  };

  const statusColor = (status: string) => {
    if (status === "active") return "bg-green-500/20 text-green-400";
    if (status === "expired") return "bg-red-500/20 text-red-400";
    return "bg-gray-500/20 text-gray-400";
  };

  const providerLogo = (id: string) => PROVIDER_CATALOGUE.find((p) => p.id === id)?.logo || "🔑";
  const filteredProviders = PROVIDER_CATALOGUE.filter((p) => catFilter === "all" || p.category === catFilter);
  const selectedProvider = PROVIDER_CATALOGUE.find((p) => p.id === form.provider);

  // ─── Test indicator ───────────────────────────────────────────────────────────

  const TestIndicator = ({ id }: { id: string }) => {
    const isTesting = testing.has(id);
    const result = testResults[id];
    if (isTesting) return <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />;
    if (!result) return null;
    return result.reachable
      ? <span className="flex items-center gap-1 text-[10px] text-green-400"><Wifi className="h-3 w-3" />{result.latencyMs}ms</span>
      : <span className="flex items-center gap-1 text-[10px] text-red-400"><WifiOff className="h-3 w-3" />Falhou</span>;
  };

  // ─── Key card for discovery tab ───────────────────────────────────────────────

  const DbKeyCard = ({ item }: { item: ApiKey }) => {
    const k = item;
    const isTesting = testing.has(k.id);
    const result = testResults[k.id];
    return (
      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-lg">
              {providerLogo(k.provider)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{k.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{k.provider}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(k.status)}`}>
              {k.status === "active" ? "Ativa" : k.status === "inactive" ? "Inativa" : "Expirada"}
            </span>
          </div>
        </div>

        {/* Test result bar */}
        {(isTesting || result) && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-medium ${
            isTesting
              ? "bg-red-500/10 text-red-300"
              : result?.reachable
                ? "bg-green-500/10 text-green-300"
                : "bg-red-500/10 text-red-300"
          }`}>
            {isTesting
              ? <><Loader2 className="h-3 w-3 animate-spin" /> A testar conectividade...</>
              : result?.reachable
                ? <><Wifi className="h-3 w-3" /> {result.message}</>
                : <><WifiOff className="h-3 w-3" /> {result?.message}</>
            }
          </div>
        )}

        {/* Usage types */}
        {k.usageTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {k.usageTypes.slice(0, 4).map((t) => (
              <span key={t} className="rounded bg-[#2A2A2A] px-1.5 py-0.5 text-[9px] text-gray-300">
                {USAGE_TYPES.find((u) => u.value === t)?.label || t}
              </span>
            ))}
            {k.usageTypes.length > 4 && (
              <span className="text-[10px] text-gray-500">+{k.usageTypes.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-[#2A2A2A] pt-2">
          <div className="flex items-center gap-1">
            <TestIndicator id={k.id} />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => testKey(k.id)}
              disabled={isTesting}
              title="Testar conectividade"
              className="flex items-center gap-1 rounded-lg border border-[#2A2A2A] bg-[#0E0E16] px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
              Testar
            </button>
            <button
              onClick={() => openEdit(k)}
              title="Editar"
              className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-white"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => deleteKey(k.id)}
              title="Remover"
              className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#1E1E2A] bg-gradient-to-br from-[#151520] to-[#0E0E16] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#E50914]/10 border border-[#E50914]/20">
            <Key className="h-5 w-5 text-[#E50914]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Gestão de API Keys</h2>
            <p className="text-xs text-gray-400">{keys.length} chave{keys.length !== 1 ? "s" : ""} na base de dados · {discovery?.envApis.filter((a) => a.configured).length ?? 0} de {discovery?.envApis.length ?? 0} APIs de ambiente configuradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} title="Atualizar" className="inline-flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-white/[0.02] px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#E50914]/20 hover:shadow-[#E50914]/30 transition-shadow">
            <Plus className="h-4 w-4" /> Nova API Key
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#2A2A2A]">
        {(["keys", "discovery"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? "border-b-2 border-[#E50914] text-white" : "text-gray-400 hover:text-white"}`}>
            {tab === "keys" ? "API Keys" : "Descoberta de APIs"}
          </button>
        ))}
      </div>

      {/* ── TAB: KEYS ── */}
      {activeTab === "keys" && (
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  {["Nome / Provedor", "Status", "Utilização", "Requests", "Prioridade", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">A carregar...</td></tr>
                ) : keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Key className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">Nenhuma API Key configurada</p>
                      <p className="text-xs text-gray-600 mt-1">Clique em &quot;Nova API Key&quot; para começar</p>
                    </td>
                  </tr>
                ) : keys.map((key) => (
                  <tr key={key.id} className="border-b border-[#2A2A2A] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-base">
                          {providerLogo(key.provider)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{key.name}</p>
                          <p className="text-xs text-gray-400">{key.provider}</p>
                          {key.baseUrl && <p className="text-[10px] text-gray-500">{key.baseUrl}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(key.status)}`}>
                        {key.status === "active" ? "Ativa" : key.status === "inactive" ? "Inativa" : "Expirada"}
                      </span>
                      {key.errorCount > 0 && (
                        <span className="ml-1 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                          {key.errorCount} erros
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {key.usageTypes.slice(0, 3).map((t) => (
                          <span key={t} className="rounded bg-[#2A2A2A] px-1.5 py-0.5 text-[9px] text-gray-300">
                            {USAGE_TYPES.find((u) => u.value === t)?.label || t}
                          </span>
                        ))}
                        {key.usageTypes.length > 3 && (
                          <span className="text-[10px] text-gray-500">+{key.usageTypes.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">
                      <span className="font-semibold text-white">{key.requestsUsed.toLocaleString()}</span>
                      {key.requestLimit ? <span className="text-gray-500"> / {key.requestLimit.toLocaleString()}</span> : null}
                      {key.requestLimit ? (
                        <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-[#2A2A2A]">
                          <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(100, (key.requestsUsed / key.requestLimit) * 100)}%` }} />
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#2A2A2A] px-2 py-0.5 text-xs font-bold text-gray-300">P{key.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Test result indicator */}
                        <span className="mr-1 min-w-[48px]">
                          <TestIndicator id={key.id} />
                        </span>
                        {/* Test button */}
                        <button
                          onClick={() => testKey(key.id)}
                          disabled={testing.has(key.id)}
                          title="Testar conectividade"
                          className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                        >
                          {testing.has(key.id)
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Wifi className="h-3.5 w-3.5" />}
                        </button>
                        {/* Toggle active/inactive */}
                        <button onClick={() => toggleStatus(key)} title={key.status === "active" ? "Desativar" : "Ativar"}
                          className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-white">
                          {key.status === "active" ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5" />}
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(key)} title="Editar"
                          className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-white">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {/* Delete */}
                        <button onClick={() => deleteKey(key.id)} title="Remover"
                          className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: DISCOVERY ── */}
      {activeTab === "discovery" && discovery && (
        <div className="space-y-5">

          {/* Database API Keys section */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Key className="h-4 w-4 text-[#E50914]" />
              <h3 className="text-sm font-bold text-white">Chaves da Base de Dados</h3>
              <span className="rounded-full bg-[#2A2A2A] px-2 py-0.5 text-[10px] font-bold text-gray-400">
                {discovery.dbKeys.length}
              </span>
            </div>

            {discovery.dbKeys.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2A2A2A] bg-[#111118] p-6 text-center">
                <Key className="h-7 w-7 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma API Key guardada na base de dados</p>
                <button onClick={openCreate} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#E50914] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B00000]">
                  <Plus className="h-3.5 w-3.5" /> Adicionar API Key
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {discovery.dbKeys.map((k) => <DbKeyCard key={k.id} item={k} />)}
              </div>
            )}
          </div>

          {/* Environment APIs section */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-bold text-white">APIs de Ambiente</h3>
              <span className="rounded-full bg-[#2A2A2A] px-2 py-0.5 text-[10px] font-bold text-gray-400">
                {discovery.envApis.length}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {discovery.envApis.map((api) => (
                <div
                  key={api.key}
                  className="group relative overflow-hidden rounded-2xl border border-[#22222E] bg-gradient-to-b from-[#151520] to-[#101018] p-4 transition-all hover:-translate-y-0.5 hover:border-[#E50914]/25 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
                >
                  <div
                    className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity ${
                      api.configured ? "bg-emerald-500/10" : "bg-red-500/10"
                    } opacity-70 group-hover:opacity-100`}
                  />
                  <div className="relative flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/15">
                        <Globe className="h-4 w-4 text-red-400" />
                      </div>
                      <span className="font-bold text-white text-sm truncate">{api.name}</span>
                    </div>
                    <span
                      className={`flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        api.configured ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {api.configured ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                      {api.configured ? "Configurada" : "Não configurada"}
                    </span>
                  </div>

                  <p className="relative text-xs text-gray-400 mb-0.5">{api.provider}</p>
                  <p className="relative text-[10px] text-gray-600 mb-3 font-mono truncate">{api.baseUrl}</p>

                  <div className="relative flex flex-wrap gap-1 mb-3">
                    {api.usageTypes.map((t) => (
                      <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-gray-300 border border-white/5">
                        {USAGE_TYPES.find((u) => u.value === t)?.label || t}
                      </span>
                    ))}
                  </div>

                  <div className="relative flex items-center justify-between border-t border-[#22222E] pt-3">
                    {(discovery.importStats.events[api.key] || discovery.importStats.lives[api.key]) ? (
                      <div className="flex gap-3">
                        {discovery.importStats.events[api.key] && (
                          <span className="text-xs text-gray-400">
                            <span className="font-bold text-white">{discovery.importStats.events[api.key]}</span> eventos
                          </span>
                        )}
                        {discovery.importStats.lives[api.key] && (
                          <span className="text-xs text-gray-400">
                            <span className="font-bold text-white">{discovery.importStats.lives[api.key]}</span> lives
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-600">Sem dados importados</span>
                    )}

                    <button
                      onClick={() => openEnvEdit(api)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors border ${
                        api.configured
                          ? "border-[#2A2A38] bg-white/[0.03] text-gray-300 hover:border-red-500/30 hover:text-red-400"
                          : "border-[#E50914]/30 bg-[#E50914]/10 text-[#E50914] hover:bg-[#E50914]/20"
                      }`}
                    >
                      {api.configured ? <Edit2 className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
                      {api.configured ? "Editar" : "Configurar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import Stats section */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
            <h3 className="font-semibold text-white mb-3 text-sm">Dados Importados por Fonte</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Eventos</p>
                {Object.entries(discovery.importStats.events).map(([source, count]) => (
                  <div key={source} className="flex justify-between py-1 border-b border-[#2A2A2A] last:border-0">
                    <span className="text-xs text-gray-300">{source}</span>
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                ))}
                {Object.keys(discovery.importStats.events).length === 0 && (
                  <p className="text-xs text-gray-500">Nenhum evento importado</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Lives</p>
                {Object.entries(discovery.importStats.lives).map(([source, count]) => (
                  <div key={source} className="flex justify-between py-1 border-b border-[#2A2A2A] last:border-0">
                    <span className="text-xs text-gray-300">{source}</span>
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                ))}
                {Object.keys(discovery.importStats.lives).length === 0 && (
                  <p className="text-xs text-gray-500">Nenhuma live importada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E50914]/10 border border-[#E50914]/20">
                  <Key className="h-4 w-4 text-[#E50914]" />
                </div>
                <div>
                  <h3 className="font-black text-white">
                    {editKey ? "Editar API Key" : modalStep === "provider" ? "Selecionar Provedor" : `Configurar: ${selectedProvider?.label || form.provider}`}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {editKey ? "Atualize os dados da chave" : modalStep === "provider" ? "Escolha o tipo de API a integrar" : "Insira as credenciais do provedor"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!editKey && (
                  <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500">
                    {(["provider", "configure"] as ModalStep[]).map((s, i) => (
                      <span key={s} className="flex items-center gap-1">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border ${modalStep === s ? "bg-[#E50914] border-[#E50914] text-white" : s === "configure" && modalStep === "configure" ? "bg-green-600 border-green-600 text-white" : "border-[#2A2A38] text-gray-600"}`}>
                          {i + 1}
                        </span>
                        {i < 1 && <span className="text-gray-700">›</span>}
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white">✕</button>
              </div>
            </div>

            {/* ── STEP: PROVIDER SELECTION ── */}
            {!editKey && modalStep === "provider" && (
              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                <div className="flex gap-1.5 flex-wrap">
                  {[["all", "Todos"], ...Object.entries(CATEGORY_META).map(([k, v]) => [k, v.label])].map(([k, label]) => (
                    <button key={k} onClick={() => setCatFilter(k)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${catFilter === k ? "bg-[#E50914] text-white" : "bg-[#111118] text-gray-400 border border-[#1E1E2A] hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredProviders.map((provider) => {
                    const meta = CATEGORY_META[provider.category as keyof typeof CATEGORY_META];
                    const CatIcon = meta.icon;
                    return (
                      <button key={provider.id} onClick={() => handleProviderSelect(provider)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#1E1E2A] bg-[#111118] hover:border-[#E50914]/30 hover:bg-[#1A1A24] transition-all text-left group">
                        <span className="text-2xl flex-shrink-0">{provider.logo}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{provider.label}</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ color: meta.color, background: `${meta.color}15` }}>
                              <CatIcon className="h-2 w-2" /> {meta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{provider.description}</p>
                        </div>
                        {provider.url && <ExternalLink className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2 border-t border-[#1E1E2A]">
                  <button onClick={() => setModalOpen(false)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300 hover:text-white">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: CONFIGURE ── */}
            {(editKey || modalStep === "configure") && (
              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                {!editKey && (
                  <button onClick={() => setModalStep("provider")}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar à seleção de provedor
                  </button>
                )}

                {selectedProvider?.url && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/20 px-3 py-2.5">
                    <Info className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300">
                      Obtenha a sua chave em{" "}
                      <a href={selectedProvider.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">
                        {selectedProvider.url}
                      </a>
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-300">Nome *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-dark w-full px-3 py-2 text-sm" placeholder="API-Football Live" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-300">Provedor *</label>
                    <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                      className="input-dark w-full px-3 py-2 text-sm" placeholder="api-sports.io"
                      readOnly={!editKey && !!selectedProvider} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">
                    {selectedProvider?.keyLabel || "API Key"} {!editKey && "*"}
                    {editKey && <span className="ml-1 text-gray-600 font-normal">(deixe em branco para manter)</span>}
                  </label>
                  <div className="relative">
                    <input type={showKeyValue ? "text" : "password"} value={form.keyValue}
                      onChange={(e) => setForm({ ...form, keyValue: e.target.value })}
                      className="input-dark w-full px-3 py-2 pr-10 text-sm font-mono"
                      placeholder={editKey ? "••••••••••••••" : "Insira a chave da API"} />
                    <button onClick={() => setShowKeyValue(!showKeyValue)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      {showKeyValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {selectedProvider?.secretLabel && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-300">{selectedProvider.secretLabel}</label>
                    <input type="password" value={form.secretValue}
                      onChange={(e) => setForm({ ...form, secretValue: e.target.value })}
                      className="input-dark w-full px-3 py-2 text-sm font-mono" placeholder="••••••••••••••" />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">URL Base</label>
                  <input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm font-mono" placeholder="https://api.example.com" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">Descrição</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2} className="input-dark w-full resize-none px-3 py-2 text-sm" placeholder="Descrição da API Key..." />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-300">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="input-dark w-full px-3 py-2 text-sm">
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                      <option value="expired">Expirada</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-300">Prioridade</label>
                    <input type="number" min={1} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                      className="input-dark w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-300">Limite Requests</label>
                    <input type="number" value={form.requestLimit} onChange={(e) => setForm({ ...form, requestLimit: e.target.value })}
                      className="input-dark w-full px-3 py-2 text-sm" placeholder="Ex: 100000" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">Data de Expiração</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-300">Tipos de Utilização</label>
                  <div className="flex flex-wrap gap-2">
                    {USAGE_TYPES.map((type) => (
                      <button key={type.value} onClick={() => toggleUsageType(type.value)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${form.usageTypes.includes(type.value)
                          ? "bg-red-600 text-white"
                          : "bg-[#1A1A2A] text-gray-400 hover:bg-[#2A2A3A]"}`}>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            {(editKey || modalStep === "configure") && (
              <div className="flex justify-end gap-3 border-t border-[#1E1E2A] p-5 flex-shrink-0">
                <button onClick={() => setModalOpen(false)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300 hover:text-white">
                  Cancelar
                </button>
                <button onClick={save} disabled={saving} className="rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-60">
                  {saving ? "A guardar..." : editKey ? "Guardar" : "Criar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ENV API KEY EDIT MODAL ── */}
      {envModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                  <Globe className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-white">{envModalTarget.configured ? "Editar" : "Configurar"} {envModalTarget.name}</h3>
                  <p className="text-[11px] text-gray-500">{envModalTarget.provider}</p>
                </div>
              </div>
              <button onClick={() => setEnvModalTarget(null)} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/20 px-3 py-2.5">
                <Info className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">
                  Esta chave é usada em todo o sistema para importar dados via {envModalTarget.provider}.
                  {envModalTarget.configured && " Insira um novo valor para a substituir."}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Valor da chave *</label>
                <div className="relative">
                  <input
                    type={envShowValue ? "text" : "password"}
                    value={envKeyValue}
                    onChange={(e) => setEnvKeyValue(e.target.value)}
                    autoFocus
                    className="input-dark w-full px-3 py-2 pr-10 text-sm font-mono"
                    placeholder={envModalTarget.configured ? "Insira o novo valor" : "Insira a chave da API"}
                  />
                  <button onClick={() => setEnvShowValue(!envShowValue)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    {envShowValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-gray-600 font-mono">{envModalTarget.baseUrl}</p>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#1E1E2A] p-5">
              <button onClick={() => setEnvModalTarget(null)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300 hover:text-white">
                Cancelar
              </button>
              <button onClick={saveEnvKey} disabled={envSaving} className="rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-60">
                {envSaving ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
