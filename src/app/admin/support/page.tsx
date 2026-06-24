"use client";

import { useEffect, useState } from "react";
import {
  HeadphonesIcon, Plus, MessageCircle, CheckCircle,
  X, RefreshCw, Send, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  messageCount: number;
  createdAt: string;
  messages?: Message[];
}
interface Message {
  id: string; ticketId: string; userId?: string;
  userName?: string; message: string; isAdmin: boolean; createdAt: string;
}
interface Stats {
  total: number; open: number; pending: number;
  resolved: number; closed: number; critical: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  pending: "bg-blue-500/20 text-blue-400",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-gray-500/20 text-gray-400",
};
const CATEGORY_LABELS: Record<string, string> = {
  player: "Player", account: "Conta", billing: "Pagamento",
  stream: "Stream", content: "Conteúdo", technical: "Técnico", other: "Outro",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium", category: "other" });
  const [filterStatus, setFilterStatus] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(filterStatus && { status: filterStatus }) });
      const [td, sd] = await Promise.all([
        apiRequest<ApiListResponse<Ticket>>(`/support?${params}`),
        apiRequest<Stats>("/support/stats"),
      ]);
      setTickets(td.items || []);
      setStats(sd);
    } catch { toast.error("Erro ao carregar tickets"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openTicket = async (ticket: Ticket) => {
    try {
      const full = await apiRequest<Ticket & { messages: Message[] }>(`/support/${ticket.id}`);
      setSelected(full); setModalOpen(true);
    } catch { toast.error("Erro ao carregar ticket"); }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selected) return;
    setSending(true);
    try {
      await apiRequest(`/support/${selected.id}/messages`, { method: "POST", body: JSON.stringify({ message: replyMessage }) });
      setReplyMessage("");
      const full = await apiRequest<Ticket & { messages: Message[] }>(`/support/${selected.id}`);
      setSelected(full);
      toast.success("Resposta enviada!");
    } catch { toast.error("Erro ao enviar"); }
    finally { setSending(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/support/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success("Status atualizado!");
      load();
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: status as any } : null);
    } catch { toast.error("Erro ao alterar status"); }
  };

  const createTicket = async () => {
    if (!form.subject || !form.description) { toast.error("Preencha todos os campos"); return; }
    try {
      await apiRequest("/support", { method: "POST", body: JSON.stringify(form) });
      toast.success("Ticket criado!"); setCreateOpen(false);
      setForm({ subject: "", description: "", priority: "medium", category: "other" });
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao criar"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Suporte</h2>
          <p className="text-xs text-gray-400">{stats?.open || 0} tickets abertos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-sm text-white hover:bg-[#2A2A2A]"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]"><Plus className="h-4 w-4" /> Novo Ticket</button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Abertos", value: stats.open, color: "text-yellow-400" },
            { label: "Resolvidos", value: stats.resolved, color: "text-green-400" },
            { label: "Total", value: stats.total, color: "text-blue-400" },
            { label: "Críticos", value: stats.critical, color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[["", "Todos"], ["open", "Abertos"], ["pending", "Pendentes"], ["resolved", "Resolvidos"], ["closed", "Fechados"]].map(([s, l]) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${filterStatus === s ? "bg-[#E50914] text-white" : "border border-[#2A2A2A] bg-[#1A1A1A] text-gray-400 hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["Assunto", "Categoria", "Prioridade", "Status", "Msgs", "Data", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">A carregar...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <HeadphonesIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  Nenhum ticket
                </td></tr>
              ) : tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-[#2A2A2A] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                    {ticket.userName && <p className="text-[10px] text-gray-500">{ticket.userName}</p>}
                  </td>
                  <td className="px-4 py-3"><span className="rounded bg-[#2A2A2A] px-2 py-0.5 text-[10px] text-gray-300">{CATEGORY_LABELS[ticket.category] || ticket.category}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[ticket.status]}`}>{ticket.status}</span></td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-300">{ticket.messageCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[10px] text-gray-500">{new Date(ticket.createdAt).toLocaleDateString("pt-PT")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => openTicket(ticket)} className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-white" title="Ver ticket"><MessageCircle className="h-3.5 w-3.5" /></button>
                      {ticket.status !== "resolved" && ticket.status !== "closed" && (
                        <button onClick={() => changeStatus(ticket.id, "resolved")} className="rounded-lg border border-[#2A2A2A] bg-[#0E0E16] p-1.5 text-gray-400 hover:text-green-400" title="Resolver"><CheckCircle className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5">
              <div>
                <h3 className="font-black text-white">{selected.subject}</h3>
                <div className="mt-1 flex gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</span>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="rounded-xl bg-[#1A1A1A] p-4 border border-[#2A2A2A]">
                <p className="text-xs text-gray-400 mb-1">Descrição</p>
                <p className="text-sm text-gray-200">{selected.description}</p>
              </div>
              {selected.messages?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 ${msg.isAdmin ? "bg-[#E50914]/20 border border-[#E50914]/30" : "bg-[#1A1A1A] border border-[#2A2A2A]"}`}>
                    <p className="text-[10px] font-semibold text-gray-400 mb-1">{msg.isAdmin ? "Admin" : (msg.userName || "Utilizador")}</p>
                    <p className="text-sm text-gray-200">{msg.message}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{new Date(msg.createdAt).toLocaleString("pt-PT")}</p>
                  </div>
                </div>
              ))}
            </div>
            {selected.status !== "closed" && (
              <div className="border-t border-[#1E1E2A] p-4 flex gap-2">
                <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={2} placeholder="Responder..." className="input-dark flex-1 resize-none px-3 py-2 text-sm" />
                <button onClick={sendReply} disabled={sending || !replyMessage.trim()} className="rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-60"><Send className="h-4 w-4" /></button>
              </div>
            )}
            <div className="border-t border-[#1E1E2A] px-5 py-3 flex gap-2">
              {selected.status !== "resolved" && <button onClick={() => changeStatus(selected.id, "resolved")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white">Resolver</button>}
              {selected.status !== "closed" && <button onClick={() => { changeStatus(selected.id, "closed"); setModalOpen(false); }} className="rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-xs text-gray-400 hover:text-white">Fechar</button>}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5">
              <h3 className="font-black text-white">Novo Ticket</h3>
              <button onClick={() => setCreateOpen(false)} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Assunto *</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Descrição *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input-dark w-full resize-none px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">Prioridade</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-dark w-full px-3 py-2 text-sm">
                    <option value="low">Baixa</option><option value="medium">Média</option>
                    <option value="high">Alta</option><option value="critical">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-dark w-full px-3 py-2 text-sm">
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#1E1E2A] p-5">
              <button onClick={() => setCreateOpen(false)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300 hover:text-white">Cancelar</button>
              <button onClick={createTicket} className="rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white hover:bg-[#B00000]">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
