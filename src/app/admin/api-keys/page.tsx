"use client";

import { useEffect, useState } from "react";
import {
  Key, Plus, Edit2, Trash2, RefreshCw, CheckCircle, XCircle, Eye, EyeOff,
  Globe, AlertTriangle, Activity, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

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

interface Discovery {
  envApis: Array<{
    key: string; name: string; provider: string; baseUrl: string;
    usageTypes: string[]; configured: boolean;
  }>;
  dbKeys: ApiKey[];
  importStats: { events: Record<string, number>; lives: Record<string, number> };
}

const emptyForm = {
  name: "", description: "", provider: "", baseUrl: "", keyValue: "",
  status: "active", priority: 1, requestLimit: "", expiresAt: "", usageTypes: [] as string[],
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editKey, setEditKey] = useState<ApiKey | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"keys" | "discovery">("keys");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [keysData, discData] = await Promise.all([
        apiRequest<ApiKey[]>("/api-keys"),
        apiRequest<Discovery>("/api-keys/discovery"),
      ]);
      setKeys(keysData);
      setDiscovery(discData);
    } catch (err) {
      toast.error("Erro ao carregar API Keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditKey(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (key: ApiKey) => {
    setEditKey(key);
    setForm({
      name: key.name, description: key.description || "", provider: key.provider,
      baseUrl: key.baseUrl || "", keyValue: "", status: key.status,
      priority: key.priority, requestLimit: key.requestLimit ? String(key.requestLimit) : "",
      expiresAt: key.expiresAt ? key.expiresAt.slice(0, 10) : "",
      usageTypes: [...key.usageTypes],
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.provider || !form.keyValue) {
      toast.error("Nome, Provedor e Key são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        priority: Number(form.priority),
        requestLimit: form.requestLimit ? Number(form.requestLimit) : null,
        expiresAt: form.expiresAt || null,
      };
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
      toast.success("API Key removida!");
    } catch {
      toast.error("Erro ao remover");
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Gestão de API Keys</h2>
          <p className="text-xs text-gray-400">{keys.length} chaves configuradas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-sm text-white hover:bg-[#2A2A2A]">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
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

      {activeTab === "keys" && (
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
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
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhuma API Key configurada</td></tr>
                ) : keys.map((key) => (
                  <tr key={key.id} className="border-b border-[#2A2A2A] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <Key className="h-4 w-4 text-blue-400" />
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
                        {key.status}
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
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (key.requestsUsed / key.requestLimit) * 100)}%` }} />
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#2A2A2A] px-2 py-0.5 text-xs font-bold text-gray-300">P{key.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleStatus(key)} title={key.status === "active" ? "Desativar" : "Ativar"}
                          className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-white">
                          {key.status === "active" ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => openEdit(key)} title="Editar"
                          className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-white">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
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

      {activeTab === "discovery" && discovery && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {discovery.envApis.map((api) => (
              <div key={api.key} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    <span className="font-semibold text-white text-sm">{api.name}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${api.configured ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {api.configured ? "Configurada" : "Não configurada"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{api.provider}</p>
                <p className="text-[10px] text-gray-500 mb-3">{api.baseUrl}</p>
                <div className="flex flex-wrap gap-1">
                  {api.usageTypes.map((t) => (
                    <span key={t} className="rounded bg-[#2A2A2A] px-1.5 py-0.5 text-[9px] text-gray-300">
                      {USAGE_TYPES.find((u) => u.value === t)?.label || t}
                    </span>
                  ))}
                </div>
                {(discovery.importStats.events[api.key] || discovery.importStats.lives[api.key]) && (
                  <div className="mt-3 flex gap-3 border-t border-[#2A2A2A] pt-3">
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
                )}
              </div>
            ))}
          </div>

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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5">
              <h3 className="font-black text-white">{editKey ? "Editar API Key" : "Nova API Key"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">Nome *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm" placeholder="API-Football Live" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">Provedor *</label>
                  <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm" placeholder="api-sports.io" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">API Key *</label>
                <input value={form.keyValue} onChange={(e) => setForm({ ...form, keyValue: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-sm font-mono" placeholder="Insira a chave da API" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">URL Base</label>
                <input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-sm" placeholder="https://api.example.com" />
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
                        ? "bg-blue-600 text-white"
                        : "bg-[#1A1A2A] text-gray-400 hover:bg-[#2A2A3A]"
                      }`}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#1E1E2A] p-5">
              <button onClick={() => setModalOpen(false)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300 hover:text-white">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-60">
                {saving ? "A guardar..." : editKey ? "Guardar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
