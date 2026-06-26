"use client";

import { useEffect, useState } from "react";
import { HeadphonesIcon, Plus, MessageCircle, X, Send, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface Ticket {
  id: string; subject: string; description: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  category: string; messageCount: number; createdAt: string; messages?: Message[];
}
interface Message { id: string; message: string; isAdmin: boolean; createdAt: string; userName?: string; }

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const STATUS_LABELS: Record<string, string> = { open: "Aberto", pending: "Pendente", resolved: "Resolvido", closed: "Fechado" };
const CATEGORY_LABELS: Record<string, string> = {
  player: "Player", account: "Conta", billing: "Pagamento", stream: "Stream",
  content: "Conteúdo", technical: "Técnico", other: "Outro",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UserSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", category: "technical", priority: "medium" });

  const load = () => {
    setLoading(true);
    apiRequest<unknown>("/support/tickets")
      .then((r: unknown) => {
        const arr = Array.isArray(r) ? r : ((r as { tickets?: Ticket[] }).tickets || []);
        setTickets(arr as Ticket[]);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openTicket = async (ticket: Ticket) => {
    try {
      const full = await apiRequest<Ticket>(`/support/tickets/${ticket.id}`);
      setSelected(full);
    } catch { setSelected(ticket); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await apiRequest(`/support/tickets/${selected.id}/messages`, {
        method: "POST", body: JSON.stringify({ message: reply.trim() }),
      });
      setReply("");
      const updated = await apiRequest<Ticket>(`/support/tickets/${selected.id}`);
      setSelected(updated);
      toast.success("Mensagem enviada!");
    } catch { toast.error("Erro ao enviar mensagem"); }
    finally { setSending(false); }
  };

  const createTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) { toast.error("Preencha todos os campos"); return; }
    setSending(true);
    try {
      await apiRequest("/support/tickets", { method: "POST", body: JSON.stringify(form) });
      toast.success("Ticket criado!");
      setShowNew(false);
      setForm({ subject: "", description: "", category: "technical", priority: "medium" });
      load();
    } catch { toast.error("Erro ao criar ticket"); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <HeadphonesIcon className="w-6 h-6 text-[#E50914]" /> Centro de Suporte
          </h1>
          <p className="text-sm text-gray-400 mt-1">Precisa de ajuda? Estamos aqui.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-[#B00000] text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Ticket
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl border border-[#E50914]/30 bg-[#0E0E16] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Abrir Novo Ticket</h3>
            <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914] outline-none">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Prioridade</label>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914] outline-none">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
            </div>
            <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Assunto do problema"
              className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914] outline-none" />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="Descreve o teu problema em detalhe..."
              className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914] outline-none resize-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={createTicket} disabled={sending}
                className="flex items-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-[#B00000] text-white text-sm font-bold rounded-xl disabled:opacity-50">
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
          <div className="p-4 border-b border-[#1E1E2A] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Os meus Tickets</h3>
            <button onClick={load} className="text-gray-600 hover:text-white"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-[#1A1A28] animate-pulse rounded-lg" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sem tickets. Tudo bem!</p>
              <button onClick={() => setShowNew(true)} className="mt-3 text-xs text-[#E50914] hover:underline">Criar ticket</button>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E2A]">
              {tickets.map((ticket) => (
                <button key={ticket.id} onClick={() => openTicket(ticket)}
                  className={`w-full text-left p-4 hover:bg-[#111118] transition-colors ${selected?.id === ticket.id ? "bg-[#E50914]/5 border-l-2 border-[#E50914]" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABELS[ticket.category]} · {formatDate(ticket.createdAt)}</p>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  {(ticket.messageCount || 0) > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                      <MessageCircle className="w-3 h-3" /> {ticket.messageCount} mensagens
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-[#1E1E2A]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selected.subject}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${STATUS_COLORS[selected.status]}`}>
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 rounded-xl bg-[#111118] border border-[#1E1E2A]">
                  <p className="text-xs text-gray-500 mb-1">Descrição</p>
                  <p className="text-sm text-gray-300">{selected.description}</p>
                </div>
                {(selected.messages || []).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl ${msg.isAdmin ? "bg-[#E50914]/10 border border-[#E50914]/20" : "bg-[#1A1A28] border border-[#1E1E2A]"}`}>
                      <p className="text-xs font-bold mb-1" style={{ color: msg.isAdmin ? "#E50914" : "#9CA3AF" }}>
                        {msg.isAdmin ? "Suporte LiveSports" : "Tu"}
                      </p>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selected.status !== "closed" && selected.status !== "resolved" && (
                <div className="p-3 border-t border-[#1E1E2A] flex gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                    placeholder="Escreve uma mensagem..."
                    className="flex-1 bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914] outline-none" />
                  <button onClick={sendReply} disabled={sending || !reply.trim()}
                    className="px-3 py-2 bg-[#E50914] hover:bg-[#B00000] text-white rounded-lg transition-colors disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Seleciona um ticket para conversar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
