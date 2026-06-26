"use client";

import { useEffect, useState } from "react";
import { HeadphonesIcon, Plus, MessageCircle, X, Send, RefreshCw, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";

interface Ticket {
  id: string; subject: string; description: string;
  status: string; priority: string; category: string;
  messageCount: number; createdAt: string;
  messages?: Message[];
}
interface Message { id: string; message: string; isAdmin: boolean; userName?: string; createdAt: string; }

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const PRIORITY_LABELS: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta", critical: "Crítica" };
const CATEGORY_LABELS: Record<string, string> = {
  player: "Player", account: "Conta", billing: "Pagamento",
  stream: "Stream", content: "Conteúdo", technical: "Técnico", other: "Outro",
};

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium", category: "other" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ApiListResponse<Ticket>>("/support");
      setTickets(data.items || []);
    } catch { toast.error("Erro ao carregar tickets"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openTicket = async (t: Ticket) => {
    try {
      const full = await apiRequest<Ticket>(`/support/${t.id}`);
      setSelected(full);
    } catch { toast.error("Erro ao carregar ticket"); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await apiRequest(`/support/${selected.id}/messages`, { method: "POST", body: JSON.stringify({ message: reply }) });
      setReply("");
      const full = await apiRequest<Ticket>(`/support/${selected.id}`);
      setSelected(full);
      toast.success("Mensagem enviada!");
    } catch { toast.error("Erro ao enviar"); }
    finally { setSending(false); }
  };

  const createTicket = async () => {
    if (!form.subject || !form.description) { toast.error("Preenche todos os campos"); return; }
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
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5 text-[#E50914]" /> Suporte
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{tickets.filter(t => t.status === 'open' || t.status === 'pending').length} ticket(s) ativos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A]"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
            <Plus className="h-4 w-4" /> Novo Ticket
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
          <HeadphonesIcon className="h-12 w-12 opacity-30" />
          <p className="text-sm">Ainda não tens pedidos de suporte</p>
          <button onClick={() => setCreateOpen(true)} className="text-[#E50914] text-sm hover:underline">Criar primeiro ticket</button>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 cursor-pointer hover:border-[#E50914]/20 transition-all" onClick={() => openTicket(ticket)}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-white">{ticket.subject}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                    <span>·</span>
                    <span>Prioridade {PRIORITY_LABELS[ticket.priority]}</span>
                    <span>·</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString("pt-PT")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ticket.status === 'resolved' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                  <div className="flex items-center gap-1 text-gray-500">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="text-xs">{ticket.messageCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
              <div>
                <h3 className="font-black text-white text-sm">{selected.subject}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] p-3">
                <p className="text-[10px] text-gray-500 mb-1">Descrição original</p>
                <p className="text-sm text-gray-200">{selected.description}</p>
              </div>
              {(selected.messages as Message[])?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl p-3 ${msg.isAdmin ? "bg-[#E50914]/10 border border-[#E50914]/20" : "bg-[#1A1A1A] border border-[#2A2A2A]"}`}>
                    <p className="text-[10px] text-gray-400 mb-1">{msg.isAdmin ? "🛡️ Equipa de Suporte" : "Tu"}</p>
                    <p className="text-sm text-gray-200">{msg.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{new Date(msg.createdAt).toLocaleString("pt-PT")}</p>
                  </div>
                </div>
              ))}
            </div>
            {selected.status !== "closed" && selected.status !== "resolved" && (
              <div className="border-t border-[#1E1E2A] p-3 flex gap-2">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2}
                  placeholder="Escreve a tua resposta..." className="input-dark flex-1 resize-none px-3 py-2 text-sm rounded-lg" />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="rounded-xl bg-[#E50914] px-3 py-2 text-white hover:bg-[#B00000] disabled:opacity-60 transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
            {(selected.status === "resolved" || selected.status === "closed") && (
              <div className="border-t border-[#1E1E2A] p-4 text-center">
                <p className="text-sm text-emerald-400 flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Este ticket foi {selected.status === "resolved" ? "resolvido" : "fechado"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
              <h3 className="font-black text-white">Novo Pedido de Suporte</h3>
              <button onClick={() => setCreateOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Assunto *</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-sm rounded-lg" placeholder="Qual é o problema?" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Descrição *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4} className="input-dark w-full resize-none px-3 py-2 text-sm rounded-lg"
                  placeholder="Descreve o problema em detalhe, incluindo passos para reproduzir..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Prioridade</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm rounded-lg">
                    <option value="low">Baixa</option><option value="medium">Média</option>
                    <option value="high">Alta</option><option value="critical">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm rounded-lg">
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#1E1E2A] p-4">
              <button onClick={() => setCreateOpen(false)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300 hover:text-white">Cancelar</button>
              <button onClick={createTicket} className="rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white hover:bg-[#B00000]">Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
