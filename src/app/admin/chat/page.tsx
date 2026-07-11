"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageCircle, Send, BarChart2, Plus, X, Trash2, Pin, RefreshCw,
  Users, Radio, ChevronDown, CheckCircle, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";

interface ChatMessage {
  id: string; liveId: string; userName: string; message: string; admin: boolean; createdAt: string;
}
interface Poll {
  id: string; question: string; status: string; durationSec: number; endsAt?: string; totalVotes: number;
  options: { id: string; label: string; voteCount: number; percentage: number }[];
}
interface ChatStats { totalMessages: number; adminMessages: number; uniqueUsers: number; recentMessages: number; }
interface PinnedMessage { id: string; message: string; active: boolean; createdAt: string; }

const STATUS_COLORS: Record<string, string> = {
  live: "bg-[#E50914]/15 text-[#E50914]", scheduled: "bg-red-500/15 text-red-400",
  ended: "bg-gray-500/15 text-gray-400",
};

export default function AdminChatPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [selectedLive, setSelectedLive] = useState<Live | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pinnedMsg, setPinnedMsg] = useState<PinnedMessage | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [pinText, setPinText] = useState("");
  const [sending, setSending] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [tab, setTab] = useState<"chat" | "polls">("chat");
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""], duration_sec: 60 });
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiRequest<ApiListResponse<Live>>("/lives?limit=100")
      .then((d) => setLives((d.items || []).sort((a, b) => {
        if (a.status === "live" && b.status !== "live") return -1;
        if (b.status === "live" && a.status !== "live") return 1;
        return 0;
      })))
      .catch(() => toast.error("Erro ao carregar lives"));
  }, []);

  useEffect(() => {
    if (!selectedLive) return;
    setLoadingMessages(true);
    Promise.all([
      apiRequest<ChatMessage[]>(`/chat/${selectedLive.id}/messages`),
      apiRequest<ChatStats>(`/chat/${selectedLive.id}/stats`),
      apiRequest<Poll[]>("/polls/admin/all?live_id=" + selectedLive.id),
      apiRequest<PinnedMessage | null>(`/chat/${selectedLive.id}/pin`),
    ]).then(([msgs, s, p, pin]) => {
      setMessages(msgs || []);
      setStats(s);
      setPolls(p || []);
      setPinnedMsg(pin);
    }).catch(() => toast.error("Erro ao carregar dados do chat"))
      .finally(() => setLoadingMessages(false));
  }, [selectedLive]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const refreshMessages = async () => {
    if (!selectedLive) return;
    try {
      const [msgs, s] = await Promise.all([
        apiRequest<ChatMessage[]>(`/chat/${selectedLive.id}/messages`),
        apiRequest<ChatStats>(`/chat/${selectedLive.id}/stats`),
      ]);
      setMessages(msgs || []);
      setStats(s);
    } catch { toast.error("Erro ao actualizar chat"); }
  };

  const sendAdminMsg = async () => {
    if (!adminMessage.trim() || !selectedLive) return;
    setSending(true);
    try {
      await apiRequest(`/chat/${selectedLive.id}/admin-message`, {
        method: "POST", body: JSON.stringify({ message: adminMessage }),
      });
      setAdminMessage("");
      await refreshMessages();
      toast.success("Mensagem enviada!");
    } catch { toast.error("Erro ao enviar mensagem"); }
    finally { setSending(false); }
  };

  const deleteMessage = async (msgId: string) => {
    if (!selectedLive) return;
    try {
      await apiRequest(`/chat/${selectedLive.id}/messages/${msgId}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Mensagem eliminada");
    } catch { toast.error("Erro ao eliminar"); }
  };

  const pinMessage = async () => {
    if (!pinText.trim() || !selectedLive) return;
    setPinning(true);
    try {
      const data = await apiRequest<PinnedMessage>(`/chat/${selectedLive.id}/pin`, {
        method: "POST", body: JSON.stringify({ message: pinText }),
      });
      setPinnedMsg(data); setPinText("");
      toast.success("Mensagem fixada!");
    } catch { toast.error("Erro ao fixar"); }
    finally { setPinning(false); }
  };

  const unpin = async () => {
    if (!selectedLive) return;
    try {
      await apiRequest(`/chat/${selectedLive.id}/pin`, { method: "DELETE" });
      setPinnedMsg(null); toast.success("Mensagem removida");
    } catch { toast.error("Erro ao desafixar"); }
  };

  const createPoll = async () => {
    if (!pollForm.question || pollForm.options.filter((o) => o.trim()).length < 2) {
      toast.error("Pergunta e pelo menos 2 opções são obrigatórias"); return;
    }
    setCreatingPoll(true);
    try {
      const data = await apiRequest<Poll>("/polls", {
        method: "POST", body: JSON.stringify({
          live_id: selectedLive?.id || null,
          question: pollForm.question,
          options: pollForm.options.filter((o) => o.trim()),
          duration_sec: pollForm.duration_sec,
        }),
      });
      setPolls((prev) => [data, ...prev]);
      setPollForm({ question: "", options: ["", ""], duration_sec: 60 });
      setShowPollForm(false);
      toast.success("Sondagem criada!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao criar sondagem"); }
    finally { setCreatingPoll(false); }
  };

  const closePoll = async (pollId: string) => {
    try {
      const updated = await apiRequest<Poll>(`/polls/${pollId}/close`, { method: "PATCH" });
      setPolls((prev) => prev.map((p) => p.id === pollId ? updated : p));
      toast.success("Sondagem fechada");
    } catch { toast.error("Erro ao fechar sondagem"); }
  };

  const deletePoll = async (pollId: string) => {
    try {
      await apiRequest(`/polls/${pollId}`, { method: "DELETE" });
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
      toast.success("Sondagem eliminada");
    } catch { toast.error("Erro ao eliminar"); }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left: Live selector */}
      <div className="w-56 flex-shrink-0 overflow-y-auto">
        <div className="mb-3">
          <h2 className="text-sm font-bold text-white">Chat das Lives</h2>
          <p className="text-xs text-gray-500">Seleciona uma transmissão</p>
        </div>
        <div className="space-y-1.5">
          {lives.map((live) => (
            <button key={live.id} onClick={() => setSelectedLive(live)}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                selectedLive?.id === live.id
                  ? "border-[#E50914]/40 bg-[#E50914]/10" : "border-[#1E1E2A] bg-[#0E0E16] hover:border-[#2A2A3A]"
              }`}>
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${STATUS_COLORS[live.status] || STATUS_COLORS.ended}`}>
                  {live.status === "live" ? "🔴 LIVE" : live.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs font-semibold text-white mt-1.5 line-clamp-2">{live.title}</p>
              {live.teamA && live.teamB && (
                <p className="text-[10px] text-gray-500 mt-0.5">{live.teamA} vs {live.teamB}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat/polls area */}
      {!selectedLive ? (
        <div className="flex-1 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto opacity-20 mb-3" />
            <p className="text-sm">Seleciona uma live para gerir o chat</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
            <div>
              <h3 className="text-sm font-bold text-white">{selectedLive.title}</h3>
              {stats && (
                <div className="flex items-center gap-3 mt-1">
                  {[
                    { icon: MessageCircle, label: stats.totalMessages + " msgs", color: "text-red-400" },
                    { icon: Users, label: stats.uniqueUsers + " users", color: "text-emerald-400" },
                    { icon: Clock, label: stats.recentMessages + " recentes", color: "text-yellow-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className={`flex items-center gap-1 ${color}`}>
                      <Icon className="h-3 w-3" />
                      <span className="text-[10px] font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={refreshMessages} className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-all">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#1E1E2A]">
            {[
              { key: "chat", label: "Chat", icon: MessageCircle },
              { key: "polls", label: "Sondagens", icon: BarChart2 },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                  tab === key ? "text-[#E50914] border-b-2 border-[#E50914]" : "text-gray-400 hover:text-white"
                }`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === "chat" ? (
            <>
              {/* Pinned message */}
              {pinnedMsg && (
                <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
                  <Pin className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="flex-1 text-xs text-yellow-200">{pinnedMsg.message}</p>
                  <button onClick={unpin} className="text-gray-500 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingMessages ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#E50914]" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                    <MessageCircle className="h-8 w-8 opacity-20 mb-2" />
                    <p className="text-sm">Sem mensagens no chat</p>
                  </div>
                ) : messages.map((msg) => (
                  <div key={msg.id} className={`group flex items-start gap-2 ${msg.admin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-xl px-3 py-2 ${
                      msg.admin ? "bg-[#E50914]/15 border border-[#E50914]/20" : "bg-[#1A1A2A] border border-[#2A2A3A]"
                    }`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold ${msg.admin ? "text-[#E50914]" : "text-gray-300"}`}>
                          {msg.admin ? "🛡️ Admin" : msg.userName}
                        </span>
                        <span className="text-[9px] text-gray-600">
                          {new Date(msg.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200">{msg.message}</p>
                    </div>
                    {!msg.admin && (
                      <button onClick={() => deleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all flex-shrink-0 mt-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Pin message */}
              <div className="border-t border-[#1E1E2A] px-3 pt-2">
                <div className="flex gap-2">
                  <input value={pinText} onChange={(e) => setPinText(e.target.value)}
                    placeholder="Mensagem para fixar no chat..."
                    className="input-dark flex-1 px-3 py-1.5 text-xs rounded-lg" />
                  <button onClick={pinMessage} disabled={pinning || !pinText.trim()}
                    className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-60 transition-all">
                    <Pin className="h-3.5 w-3.5" /> Fixar
                  </button>
                </div>
              </div>

              {/* Admin message input */}
              <div className="border-t border-[#1E1E2A] p-3 flex gap-2">
                <input value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAdminMsg()}
                  placeholder="Responder como Admin..."
                  className="input-dark flex-1 px-3 py-2 text-sm rounded-lg" />
                <button onClick={sendAdminMsg} disabled={sending || !adminMessage.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-60 transition-all">
                  <Send className="h-4 w-4" />
                  {sending ? "..." : "Enviar"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{polls.length} sondagen(s)</p>
                <button onClick={() => setShowPollForm(!showPollForm)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#E50914] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B00000]">
                  <Plus className="h-3.5 w-3.5" /> Nova Sondagem
                </button>
              </div>

              {showPollForm && (
                <div className="rounded-xl border border-[#E50914]/20 bg-[#E50914]/5 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white">Criar Sondagem</h4>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Pergunta *</label>
                    <input value={pollForm.question} onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                      className="input-dark w-full px-3 py-1.5 text-sm rounded-lg" placeholder="Quem vai ganhar?" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] text-gray-400">Opções *</label>
                    {pollForm.options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={opt} onChange={(e) => {
                          const newOpts = [...pollForm.options]; newOpts[i] = e.target.value;
                          setPollForm({ ...pollForm, options: newOpts });
                        }} className="input-dark flex-1 px-3 py-1.5 text-sm rounded-lg" placeholder={`Opção ${i + 1}`} />
                        {i >= 2 && (
                          <button onClick={() => setPollForm({ ...pollForm, options: pollForm.options.filter((_, j) => j !== i) })}
                            className="text-gray-500 hover:text-red-400"><X className="h-4 w-4" /></button>
                        )}
                      </div>
                    ))}
                    {pollForm.options.length < 6 && (
                      <button onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ""] })}
                        className="text-xs text-[#E50914] hover:underline">+ Adicionar opção</button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Duração (segundos)</label>
                    <select value={pollForm.duration_sec} onChange={(e) => setPollForm({ ...pollForm, duration_sec: Number(e.target.value) })}
                      className="input-dark px-3 py-1.5 text-sm rounded-lg">
                      <option value={30}>30 segundos</option><option value={60}>1 minuto</option>
                      <option value={120}>2 minutos</option><option value={300}>5 minutos</option>
                      <option value={600}>10 minutos</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowPollForm(false)} className="text-xs text-gray-400 hover:text-white px-3 py-1.5">Cancelar</button>
                    <button onClick={createPoll} disabled={creatingPoll}
                      className="rounded-xl bg-[#E50914] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#B00000] disabled:opacity-60">
                      {creatingPoll ? "A criar..." : "Criar"}
                    </button>
                  </div>
                </div>
              )}

              {polls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <BarChart2 className="h-8 w-8 opacity-20 mb-2" />
                  <p className="text-sm">Nenhuma sondagem criada</p>
                </div>
              ) : polls.map((poll) => (
                <div key={poll.id} className={`rounded-xl border p-4 ${poll.status === "active" ? "border-emerald-500/20 bg-emerald-500/5" : "border-[#2A2A2A] bg-[#1A1A1A]"}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${poll.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {poll.status === "active" ? "ATIVA" : "FECHADA"}
                      </span>
                      <p className="text-sm font-semibold text-white mt-1">{poll.question}</p>
                      <p className="text-[10px] text-gray-500">{poll.totalVotes} voto(s)</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {poll.status === "active" && (
                        <button onClick={() => closePoll(poll.id)} className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all" title="Fechar">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => deletePoll(poll.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {poll.options.map((opt) => (
                      <div key={opt.id}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-300">{opt.label}</span>
                          <span className="font-bold text-white">{opt.percentage}% ({opt.voteCount})</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
                          <div className="h-full bg-[#E50914] rounded-full transition-all" style={{ width: `${opt.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
