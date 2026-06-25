"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, RefreshCw, Shield, Eye, X, Radio, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, publicApiRequest, type ApiListResponse } from "@/lib/api";
import type { Live, LiveComment } from "@/types";
import { formatNumber } from "@/utils";

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

const CHAT_COLORS = ["text-sky-400","text-emerald-400","text-violet-400","text-amber-400","text-pink-400","text-teal-400"];
function chatColor(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return CHAT_COLORS[n % CHAT_COLORS.length];
}

export default function AdminChatPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [selectedLive, setSelectedLive] = useState<Live | null>(null);
  const [chat, setChat] = useState<LiveComment[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=50")
      .then((r) => setLives(r.items || []))
      .catch(() => setLives([]));
  }, []);

  const loadChat = async (live: Live) => {
    setSelectedLive(live);
    setLoading(true);
    try {
      const msgs = await publicApiRequest<LiveComment[]>(`/lives/${live.id}/comments?limit=100`);
      setChat(msgs);
    } catch {
      setChat([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshChat = async () => {
    if (!selectedLive) return;
    try {
      const msgs = await publicApiRequest<LiveComment[]>(`/lives/${selectedLive.id}/comments?limit=100`);
      setChat(msgs);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!selectedLive) return;
    const t = setInterval(refreshChat, 10000);
    return () => clearInterval(t);
  }, [selectedLive]);

  const sendAdminMessage = async () => {
    if (!message.trim() || !selectedLive) return;
    setSending(true);
    try {
      const created = await apiRequest<LiveComment>(`/lives/${selectedLive.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          clientId: "admin",
          userName: "Admin",
          message: message.trim(),
          isAdmin: true,
        }),
      });
      setChat((c) => [...c, created]);
      setMessage("");
      toast.success("Mensagem enviada como Admin");
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await apiRequest(`/lives/${selectedLive?.id}/comments/${msgId}`, { method: "DELETE" });
      setChat((c) => c.filter((m) => m.id !== msgId));
      toast.success("Mensagem removida");
    } catch {
      toast.error("Erro ao remover mensagem");
    }
  };

  const filteredLives = lives.filter((l) =>
    !search || l.title.toLowerCase().includes(search.toLowerCase())
  );

  const liveLives = filteredLives.filter((l) => l.status === "live");
  const otherLives = filteredLives.filter((l) => l.status !== "live");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#E50914]" /> Gestão de Chat
          </h1>
          <p className="text-xs text-gray-500">Modere e responda ao chat das lives</p>
        </div>
        {selectedLive && (
          <button onClick={refreshChat} className="flex items-center gap-2 px-3 py-2 text-xs border border-[#1E1E2A] rounded-xl text-gray-400 hover:text-white hover:border-[#E50914]/30 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#1E1E2A]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar live..."
                className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-[#E50914]/50 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {liveLives.length > 0 && (
              <div>
                <div className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider border-b border-[#1E1E2A]">
                  Ao Vivo Agora ({liveLives.length})
                </div>
                {liveLives.map((live) => (
                  <button
                    key={live.id}
                    onClick={() => loadChat(live)}
                    className={`w-full text-left p-3 hover:bg-[#111118] transition-colors border-b border-[#1E1E2A]/50 ${selectedLive?.id === live.id ? "bg-[#E50914]/5 border-l-2 border-l-[#E50914]" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse flex-shrink-0" />
                      <p className="text-xs font-semibold text-white truncate">{live.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-600">
                      <Eye className="w-3 h-3" />{formatNumber(live.viewerCount)}
                      <MessageCircle className="w-3 h-3 ml-1" />{live.commentCount || 0}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {otherLives.length > 0 && (
              <div>
                <div className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider border-b border-[#1E1E2A]">
                  Outras Lives
                </div>
                {otherLives.map((live) => (
                  <button
                    key={live.id}
                    onClick={() => loadChat(live)}
                    className={`w-full text-left p-3 hover:bg-[#111118] transition-colors border-b border-[#1E1E2A]/50 ${selectedLive?.id === live.id ? "bg-[#E50914]/5 border-l-2 border-l-[#E50914]" : ""}`}
                  >
                    <p className="text-xs font-semibold text-gray-400 truncate">{live.title}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{live.status}</p>
                  </button>
                ))}
              </div>
            )}
            {filteredLives.length === 0 && (
              <div className="py-10 text-center">
                <Radio className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Nenhuma live encontrada</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden flex flex-col">
          {selectedLive ? (
            <>
              <div className="p-4 border-b border-[#1E1E2A] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedLive.status === "live" && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-[#E50914] bg-[#E50914]/10 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" /> AO VIVO
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-bold text-white">{selectedLive.title}</p>
                    <p className="text-xs text-gray-500">{formatNumber(selectedLive.viewerCount)} espectadores · {chat.length} mensagens</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedLive(null); setChat([]); }} className="text-gray-600 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="w-5 h-5 text-gray-600 animate-spin" />
                  </div>
                ) : chat.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-600">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">Sem mensagens ainda</p>
                  </div>
                ) : (
                  chat.map((msg) => (
                    <div key={msg.id} className={`group flex items-start gap-2 ${msg.admin ? "bg-[#E50914]/5 rounded-xl p-2 border border-[#E50914]/10" : ""}`}>
                      {msg.admin && <Shield className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-black mr-2 ${msg.admin ? "text-[#E50914]" : chatColor(msg.userName)}`}>
                          {msg.admin ? "⚡ Admin" : msg.userName}
                        </span>
                        <span className="text-xs text-gray-300">{msg.message}</span>
                        <span className="text-[10px] text-gray-700 ml-2">{timeAgo(msg.createdAt)}</span>
                      </div>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-400 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-[#1E1E2A]">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-[#E50914]" />
                  <span className="text-[10px] text-[#E50914] font-bold">A enviar como Admin</span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendAdminMessage()}
                    placeholder="Escreve uma mensagem como admin..."
                    className="flex-1 bg-[#111118] border border-[#E50914]/20 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/60 outline-none"
                  />
                  <button
                    onClick={sendAdminMessage}
                    disabled={sending || !message.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#E50914] hover:bg-[#B00000] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Seleciona uma live para gerir o chat</p>
              <p className="text-xs text-gray-600 mt-1">Podes responder e moderar mensagens em tempo real</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
