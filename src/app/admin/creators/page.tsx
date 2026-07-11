"use client";

import { useEffect, useState } from "react";
import {
  Tv2, Check, X, RefreshCw, Users, Star, Eye, AlertCircle,
  Plus, Edit2, Shield, Globe, Link as LinkIcon, Image, Search,
  ToggleLeft, ToggleRight, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";

interface Application {
  id: string; user_id: string; channel_name: string; description?: string;
  sport?: string; status: string; admin_notes?: string;
  user_name?: string; user_email?: string; created_at: string;
}

interface Channel {
  id: string; userId?: string; name: string; slug: string; description?: string;
  avatar?: string; banner?: string; sport?: string; country?: string;
  status: string; verified: boolean;
  subscriberCount: number; totalViews: number; liveCount: number;
  websiteUrl?: string; socialLinks?: Record<string, string>;
  ownerName?: string; ownerEmail?: string; createdAt: string; updatedAt?: string;
}

interface UserOption { id: string; name: string; email: string; avatar?: string; }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  suspended: "bg-red-500/15 text-red-400 border-red-500/30",
};

const SPORT_OPTIONS = [
  { value: "", label: "Todos os desportos" },
  { value: "football", label: "Futebol" },
  { value: "basketball", label: "Basquetebol" },
  { value: "tennis", label: "Ténis" },
  { value: "ufc", label: "UFC / MMA" },
  { value: "f1", label: "Fórmula 1" },
  { value: "volleyball", label: "Voleibol" },
  { value: "baseball", label: "Baseball" },
  { value: "other", label: "Outro" },
];

const emptyChannelForm = {
  user_id: "",
  name: "",
  slug: "",
  description: "",
  avatar: "",
  banner: "",
  sport: "",
  country: "",
  website_url: "",
  status: "active",
  verified: false,
};

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminCreatorsPage() {
  const [tab, setTab] = useState<"applications" | "channels">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Application review modal
  const [selected, setSelected] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Create channel modal
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelForm, setChannelForm] = useState(emptyChannelForm);
  const [savingChannel, setSavingChannel] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Edit channel modal
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editForm, setEditForm] = useState<Partial<typeof emptyChannelForm>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ApiListResponse<Application>>("/creator/applications");
      setApplications(data.items || []);
    } catch { toast.error("Erro ao carregar candidaturas"); }
    finally { setLoading(false); }
  };

  const loadChannels = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ApiListResponse<Channel>>("/creator/channels");
      setChannels(data.items || []);
    } catch { toast.error("Erro ao carregar canais"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === "applications") loadApplications();
    else loadChannels();
  }, [tab]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) { setUserOptions([]); return; }
    setLoadingUsers(true);
    try {
      const data = await apiRequest<ApiListResponse<UserOption>>(`/users?limit=10&search=${encodeURIComponent(query)}`);
      setUserOptions(data.items || []);
    } catch { setUserOptions([]); }
    finally { setLoadingUsers(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 350);
    return () => clearTimeout(t);
  }, [userSearch]);

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selected) return;
    setProcessing(true);
    try {
      await apiRequest(`/creator/applications/${selected.id}`, {
        method: "PATCH", body: JSON.stringify({ status, admin_notes: notes }),
      });
      toast.success(status === "approved" ? "Candidatura aprovada!" : "Candidatura rejeitada");
      setSelected(null); setNotes("");
      loadApplications();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao processar"); }
    finally { setProcessing(false); }
  };

  const toggleChannelStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await apiRequest(`/creator/channels/${id}/status`, {
        method: "PATCH", body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Canal ${newStatus === "active" ? "ativado" : "suspenso"}!`);
      loadChannels();
    } catch { toast.error("Erro ao alterar status"); }
  };

  const toggleVerified = async (id: string, currentVerified: boolean) => {
    try {
      await apiRequest(`/creator/channels/${id}/verify`, {
        method: "PATCH", body: JSON.stringify({ verified: !currentVerified }),
      });
      toast.success(!currentVerified ? "Canal verificado!" : "Verificação removida");
      loadChannels();
    } catch { toast.error("Erro ao alterar verificação"); }
  };

  const createChannel = async () => {
    if (!channelForm.user_id) { toast.error("Selecione um utilizador"); return; }
    if (!channelForm.name.trim()) { toast.error("Nome do canal é obrigatório"); return; }
    if (!channelForm.slug.trim()) { toast.error("Slug é obrigatório"); return; }
    setSavingChannel(true);
    try {
      await apiRequest("/creator/admin/channels", {
        method: "POST",
        body: JSON.stringify({
          ...channelForm,
          verified: channelForm.verified,
        }),
      });
      toast.success("Canal criado com sucesso!");
      setShowCreateChannel(false);
      setChannelForm(emptyChannelForm);
      setUserSearch("");
      setUserOptions([]);
      loadChannels();
      setTab("channels");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao criar canal"); }
    finally { setSavingChannel(false); }
  };

  const openEditChannel = (ch: Channel) => {
    setEditingChannel(ch);
    setEditForm({
      name: ch.name,
      slug: ch.slug,
      description: ch.description || "",
      avatar: ch.avatar || "",
      banner: ch.banner || "",
      sport: ch.sport || "",
      country: ch.country || "",
      website_url: ch.websiteUrl || "",
    });
  };

  const saveEditChannel = async () => {
    if (!editingChannel) return;
    setSavingEdit(true);
    try {
      await apiRequest(`/creator/channels/${editingChannel.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      toast.success("Canal atualizado!");
      setEditingChannel(null);
      loadChannels();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao editar canal"); }
    finally { setSavingEdit(false); }
  };

  const filteredChannels = channels.filter(ch => {
    const q = search.toLowerCase();
    return !q || ch.name.toLowerCase().includes(q) || ch.slug.toLowerCase().includes(q)
      || (ch.ownerName || "").toLowerCase().includes(q) || (ch.ownerEmail || "").toLowerCase().includes(q);
  });

  const filteredApplications = applications.filter(app => {
    const q = search.toLowerCase();
    return !q || (app.user_name || "").toLowerCase().includes(q) || (app.user_email || "").toLowerCase().includes(q)
      || app.channel_name.toLowerCase().includes(q);
  });

  const pendingCount = applications.filter(a => a.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Tv2 className="h-5 w-5 text-[#E50914]" /> Criadores de Conteúdo
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Gerir candidaturas, canais e perfis de criadores</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateChannel(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] text-white text-sm font-bold hover:bg-[#B00000] transition-colors"
          >
            <Plus className="h-4 w-4" /> Criar Canal
          </button>
          <button
            onClick={() => tab === "applications" ? loadApplications() : loadChannels()}
            className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Candidaturas Pendentes", value: pendingCount, color: "text-yellow-400" },
          { label: "Total de Canais", value: channels.length, color: "text-red-400" },
          { label: "Canais Ativos", value: channels.filter(c => c.status === "active").length, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[#2A2A2A] bg-[#0E0E16] p-4">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between border-b border-[#1E1E2A] pb-0">
        <div className="flex gap-1">
          {[
            { key: "applications", label: "Candidaturas", count: pendingCount },
            { key: "channels", label: "Canais", count: channels.length },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => { setTab(key as any); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                tab === key ? "text-[#E50914] border-[#E50914]" : "text-gray-400 hover:text-white border-transparent"
              }`}>
              {label}
              {count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === key ? "bg-[#E50914]/20 text-[#E50914]" : "bg-white/10 text-gray-400"
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative pb-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="pl-8 pr-3 py-1.5 text-xs bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>
      ) : tab === "applications" ? (
        /* ── Applications Table ── */
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#0E0E16]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#111118]">
                {["Utilizador", "Canal Proposto", "Desporto", "Status", "Data", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-gray-700 mb-3" />
                  <p className="text-sm font-semibold text-gray-500">Nenhuma candidatura encontrada</p>
                </td></tr>
              ) : filteredApplications.map(app => (
                <tr key={app.id} className="border-b border-[#1A1A2A] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#E50914]/20 to-[#B00000]/20 flex items-center justify-center text-xs font-black text-[#E50914]">
                        {(app.user_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{app.user_name}</p>
                        <p className="text-[10px] text-gray-500">{app.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{app.channel_name}</p>
                    {app.description && <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{app.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400 capitalize">{app.sport || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[app.status] || "border-white/10 bg-white/5 text-gray-400"}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-gray-500 whitespace-nowrap">
                    {new Date(app.created_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-3">
                    {app.status === "pending" ? (
                      <button onClick={() => { setSelected(app); setNotes(""); }}
                        className="flex items-center gap-1 text-xs text-[#E50914] hover:underline font-semibold">
                        Analisar <ChevronRight className="h-3 w-3" />
                      </button>
                    ) : <span className="text-xs text-gray-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Channels Table ── */
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#0E0E16]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#111118]">
                {["Canal", "Proprietário", "Estatísticas", "Status", "Verificado", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredChannels.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <Tv2 className="mx-auto h-10 w-10 text-gray-700 mb-3" />
                  <p className="text-sm font-semibold text-gray-500">Nenhum canal criado</p>
                  <button onClick={() => setShowCreateChannel(true)} className="mt-3 text-xs text-[#E50914] hover:underline font-semibold">
                    + Criar primeiro canal
                  </button>
                </td></tr>
              ) : filteredChannels.map(ch => (
                <tr key={ch.id} className="border-b border-[#1A1A2A] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ch.avatar ? (
                        <img src={ch.avatar} alt="" className="h-9 w-9 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1A1A28] to-[#0E0E16] flex items-center justify-center text-sm font-black text-gray-400 border border-white/10">
                          {ch.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-white">{ch.name}</p>
                          {ch.verified && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
                        </div>
                        <p className="text-[10px] text-gray-500">/{ch.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{ch.ownerName || "—"}</p>
                    <p className="text-[10px] text-gray-500">{ch.ownerEmail || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Users className="h-3 w-3 text-red-400" />
                        <span className="font-bold text-white">{ch.subscriberCount.toLocaleString()}</span> sub.
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Eye className="h-3 w-3 text-purple-400" />
                        <span className="font-bold text-white">{ch.totalViews.toLocaleString()}</span> vistas
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Tv2 className="h-3 w-3 text-red-400" />
                        <span className="font-bold text-white">{ch.liveCount}</span> lives
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleChannelStatus(ch.id, ch.status)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors hover:opacity-80 ${STATUS_COLORS[ch.status] || "border-white/10 bg-white/5 text-gray-400"}`}
                    >
                      {ch.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleVerified(ch.id, ch.verified)} className="transition-colors">
                      {ch.verified
                        ? <ToggleRight className="h-5 w-5 text-yellow-400" />
                        : <ToggleLeft className="h-5 w-5 text-gray-600" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEditChannel(ch)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold hover:underline"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Application Review Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
              <h3 className="font-black text-white">Analisar Candidatura</h3>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-lg bg-[#1A1A2A] p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-bold">Utilizador</p>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#E50914]/30 to-[#B00000]/30 flex items-center justify-center text-xs font-black text-[#E50914]">
                    {(selected.user_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selected.user_name}</p>
                    <p className="text-[10px] text-gray-500">{selected.user_email}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-[#1A1A2A] p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-bold">Canal Proposto</p>
                <p className="text-sm font-semibold text-white">{selected.channel_name}</p>
                {selected.description && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{selected.description}</p>}
                {selected.sport && (
                  <span className="mt-2 inline-block text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full capitalize">{selected.sport}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Notas de revisão (opcional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3} className="w-full resize-none px-3 py-2 text-sm rounded-lg bg-[#1A1A2A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50"
                  placeholder="Feedback para o criador..." />
              </div>
            </div>
            <div className="flex gap-2 border-t border-[#1E1E2A] p-4">
              <button onClick={() => handleReview("rejected")} disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition-colors">
                <X className="h-4 w-4" /> Rejeitar
              </button>
              <button onClick={() => handleReview("approved")} disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                {processing ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check className="h-4 w-4" />}
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Channel Modal ── */}
      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4 sticky top-0 bg-[#0E0E16] z-10">
              <div>
                <h3 className="font-black text-white flex items-center gap-2"><Plus className="h-4 w-4 text-[#E50914]" /> Criar Canal</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Cria um perfil de canal para um utilizador existente</p>
              </div>
              <button onClick={() => { setShowCreateChannel(false); setChannelForm(emptyChannelForm); setUserSearch(""); setUserOptions([]); }}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-4 space-y-4">
              {/* User selection */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">Utilizador *</label>
                {channelForm.user_id ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A2A] border border-emerald-500/30">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-black text-emerald-400">
                      {(userOptions.find(u => u.id === channelForm.user_id)?.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{userOptions.find(u => u.id === channelForm.user_id)?.name || channelForm.user_id}</p>
                      <p className="text-[10px] text-gray-500 truncate">{userOptions.find(u => u.id === channelForm.user_id)?.email}</p>
                    </div>
                    <button onClick={() => setChannelForm({ ...channelForm, user_id: "" })} className="text-gray-500 hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                      <input
                        value={userSearch} onChange={e => setUserSearch(e.target.value)}
                        placeholder="Pesquisar utilizador por nome ou email..."
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50"
                      />
                    </div>
                    {loadingUsers && <p className="text-xs text-gray-500 px-1">A pesquisar...</p>}
                    {userOptions.length > 0 && (
                      <div className="rounded-lg border border-[#2A2A2A] bg-[#111118] divide-y divide-[#1A1A2A] max-h-40 overflow-y-auto">
                        {userOptions.map(u => (
                          <button key={u.id} onClick={() => { setChannelForm({ ...channelForm, user_id: u.id }); setUserSearch(u.name); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left">
                            <div className="h-7 w-7 rounded-full bg-[#1A1A2A] flex items-center justify-center text-[10px] font-black text-gray-400 flex-shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {userSearch.length > 2 && !loadingUsers && userOptions.length === 0 && (
                      <p className="text-xs text-gray-500 px-1">Nenhum utilizador encontrado</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Nome do Canal *</label>
                  <input
                    value={channelForm.name}
                    onChange={e => {
                      const name = e.target.value;
                      setChannelForm({ ...channelForm, name, slug: channelForm.slug || slugify(name) });
                    }}
                    placeholder="Ex: SportsPT TV"
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Slug *</label>
                  <input
                    value={channelForm.slug}
                    onChange={e => setChannelForm({ ...channelForm, slug: slugify(e.target.value) })}
                    placeholder="ex: sportspt-tv"
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Descrição</label>
                <textarea
                  value={channelForm.description}
                  onChange={e => setChannelForm({ ...channelForm, description: e.target.value })}
                  rows={2} placeholder="Descrição do canal..."
                  className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Image className="h-3 w-3" /> Avatar (URL)
                  </label>
                  <input
                    value={channelForm.avatar}
                    onChange={e => setChannelForm({ ...channelForm, avatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Image className="h-3 w-3" /> Banner (URL)
                  </label>
                  <input
                    value={channelForm.banner}
                    onChange={e => setChannelForm({ ...channelForm, banner: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Desporto</label>
                  <select
                    value={channelForm.sport}
                    onChange={e => setChannelForm({ ...channelForm, sport: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#E50914]/50"
                  >
                    {SPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">País</label>
                  <input
                    value={channelForm.country}
                    onChange={e => setChannelForm({ ...channelForm, country: e.target.value })}
                    placeholder="Ex: PT, BR, AO"
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Website
                </label>
                <input
                  value={channelForm.website_url}
                  onChange={e => setChannelForm({ ...channelForm, website_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Status Inicial</label>
                  <select
                    value={channelForm.status}
                    onChange={e => setChannelForm({ ...channelForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#E50914]/50"
                  >
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setChannelForm({ ...channelForm, verified: !channelForm.verified })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${channelForm.verified ? "bg-yellow-500" : "bg-[#2A2A2A]"}`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${channelForm.verified ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" /> Verificado
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-[#1E1E2A] p-4 sticky bottom-0 bg-[#0E0E16]">
              <button
                onClick={() => { setShowCreateChannel(false); setChannelForm(emptyChannelForm); setUserSearch(""); setUserOptions([]); }}
                className="flex-1 py-2.5 rounded-xl border border-[#2A2A2A] text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createChannel} disabled={savingChannel}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E50914] text-white text-sm font-bold hover:bg-[#B00000] disabled:opacity-60 transition-colors"
              >
                {savingChannel ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Plus className="h-4 w-4" />}
                Criar Canal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Channel Modal ── */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4 sticky top-0 bg-[#0E0E16] z-10">
              <div>
                <h3 className="font-black text-white flex items-center gap-2"><Edit2 className="h-4 w-4 text-red-400" /> Editar Canal</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{editingChannel.name}</p>
              </div>
              <button onClick={() => setEditingChannel(null)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Nome *</label>
                  <input value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Slug</label>
                  <input value={editForm.slug || ""} onChange={e => setEditForm({ ...editForm, slug: slugify(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-red-500/50 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Descrição</label>
                <textarea value={editForm.description || ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-red-500/50 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Image className="h-3 w-3" /> Avatar (URL)
                  </label>
                  <input value={editForm.avatar || ""} onChange={e => setEditForm({ ...editForm, avatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Image className="h-3 w-3" /> Banner (URL)
                  </label>
                  <input value={editForm.banner || ""} onChange={e => setEditForm({ ...editForm, banner: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">Desporto</label>
                  <select value={editForm.sport || ""} onChange={e => setEditForm({ ...editForm, sport: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-red-500/50">
                    {SPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">País</label>
                  <input value={editForm.country || ""} onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                    placeholder="Ex: PT, BR, AO"
                    className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" /> Website
                </label>
                <input value={editForm.website_url || ""} onChange={e => setEditForm({ ...editForm, website_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 text-sm bg-[#1A1A2A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
              </div>

              {/* Preview */}
              {(editForm.avatar || editForm.banner) && (
                <div className="rounded-lg border border-[#2A2A2A] overflow-hidden">
                  {editForm.banner && <img src={editForm.banner} alt="banner" className="w-full h-20 object-cover opacity-60" />}
                  <div className="flex items-center gap-3 p-3 -mt-6 relative">
                    {editForm.avatar && <img src={editForm.avatar} alt="avatar" className="h-12 w-12 rounded-full border-2 border-[#0E0E16] object-cover" />}
                    <div>
                      <p className="text-sm font-bold text-white">{editForm.name || editingChannel.name}</p>
                      <p className="text-[10px] text-gray-500">/{editForm.slug || editingChannel.slug}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-[#1E1E2A] p-4 sticky bottom-0 bg-[#0E0E16]">
              <button onClick={() => setEditingChannel(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#2A2A2A] text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button onClick={saveEditChannel} disabled={savingEdit}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-colors">
                {savingEdit ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check className="h-4 w-4" />}
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
