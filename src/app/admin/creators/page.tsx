"use client";

import { useEffect, useState } from "react";
import { Tv2, Check, X, RefreshCw, Users, Star, Eye, AlertCircle, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";

interface Application {
  id: string; user_id: string; channel_name: string; description?: string;
  sport?: string; status: string; admin_notes?: string;
  user_name?: string; user_email?: string; created_at: string;
}
interface Channel {
  id: string; name: string; slug: string; status: string; verified: boolean;
  subscriberCount: number; totalViews: number; liveCount: number;
  ownerName?: string; ownerEmail?: string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  active: "bg-emerald-500/15 text-emerald-400",
  suspended: "bg-red-500/15 text-red-400",
};

export default function AdminCreatorsPage() {
  const [tab, setTab] = useState<"applications" | "channels">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Tv2 className="h-5 w-5 text-[#E50914]" /> Criadores de Conteúdo
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Gerir candidaturas e canais</p>
        </div>
        <button onClick={() => tab === "applications" ? loadApplications() : loadChannels()}
          className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A]">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-[#1E1E2A] gap-1">
        {[
          { key: "applications", label: "Candidaturas", badge: applications.filter(a => a.status === "pending").length },
          { key: "channels", label: "Canais", badge: channels.length },
        ].map(({ key, label, badge }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === key ? "text-[#E50914] border-b-2 border-[#E50914]" : "text-gray-400 hover:text-white"
            }`}>
            {label}
            {badge > 0 && (
              <span className="text-[9px] font-black bg-[#E50914]/20 text-[#E50914] px-1.5 py-0.5 rounded-full">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>
      ) : tab === "applications" ? (
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#0E0E16]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["Utilizador", "Canal", "Desporto", "Status", "Data", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-gray-600 opacity-30 mb-2" />
                  <p className="text-sm text-gray-600">Nenhuma candidatura</p>
                </td></tr>
              ) : applications.map(app => (
                <tr key={app.id} className="border-b border-[#1A1A2A] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{app.user_name}</p>
                    <p className="text-[10px] text-gray-500">{app.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{app.channel_name}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{app.description || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{app.sport || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-gray-500 whitespace-nowrap">
                    {new Date(app.created_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-3">
                    {app.status === "pending" ? (
                      <button onClick={() => { setSelected(app); setNotes(""); }}
                        className="text-xs text-[#E50914] hover:underline font-semibold">Analisar</button>
                    ) : <span className="text-xs text-gray-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#0E0E16]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["Canal", "Proprietário", "Subscritores", "Lives", "Status", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <Tv2 className="mx-auto h-8 w-8 text-gray-600 opacity-30 mb-2" />
                  <p className="text-sm text-gray-600">Nenhum canal criado</p>
                </td></tr>
              ) : channels.map(ch => (
                <tr key={ch.id} className="border-b border-[#1A1A2A] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{ch.name}</p>
                      {ch.verified && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <p className="text-[10px] text-gray-500">/{ch.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{ch.ownerName || "—"}</p>
                    <p className="text-[10px] text-gray-500">{ch.ownerEmail || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-blue-400">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-sm font-bold">{ch.subscriberCount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{ch.liveCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[ch.status]}`}>{ch.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleChannelStatus(ch.id, ch.status)}
                      className={`text-xs font-semibold hover:underline ${ch.status === "active" ? "text-red-400" : "text-emerald-400"}`}>
                      {ch.status === "active" ? "Suspender" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
              <h3 className="font-black text-white">Analisar Candidatura</h3>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-lg bg-[#1A1A2A] p-3">
                <p className="text-xs text-gray-500 mb-1">Utilizador</p>
                <p className="text-sm font-semibold text-white">{selected.user_name}</p>
                <p className="text-xs text-gray-500">{selected.user_email}</p>
              </div>
              <div className="rounded-lg bg-[#1A1A2A] p-3">
                <p className="text-xs text-gray-500 mb-1">Canal Proposto</p>
                <p className="text-sm font-semibold text-white">{selected.channel_name}</p>
                {selected.description && <p className="text-xs text-gray-400 mt-1">{selected.description}</p>}
                {selected.sport && <p className="text-xs text-gray-500 mt-1">Desporto: {selected.sport}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Notas (opcional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3} className="input-dark w-full resize-none px-3 py-2 text-sm rounded-lg"
                  placeholder="Feedback para o criador..." />
              </div>
            </div>
            <div className="flex gap-2 border-t border-[#1E1E2A] p-4">
              <button onClick={() => handleReview("rejected")} disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-sm font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-60">
                <X className="h-4 w-4" /> Rejeitar
              </button>
              <button onClick={() => handleReview("approved")} disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                <Check className="h-4 w-4" /> Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
