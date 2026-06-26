"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Radio, Eye, Send, RefreshCw, Shield } from "lucide-react";
import { formatNumber } from "@/utils";
import { publicApiRequest, apiRequest, type ApiListResponse } from "@/lib/api";
import type { Live, LiveComment } from "@/types";

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

const CHAT_COLORS = ["text-sky-400","text-emerald-400","text-violet-400","text-amber-400","text-pink-400"];
function chatColor(n: string) {
  let x = 0; for (let i = 0; i < n.length; i++) x += n.charCodeAt(i);
  return CHAT_COLORS[x % CHAT_COLORS.length];
}

export default function CreatorChatPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [selectedLive, setSelectedLive] = useState<Live | null>(null);
  const [chat, setChat] = useState<LiveComment[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=20")
      .then((r) => setLives(r.items || []))
      .catch(() => setLives([]));
  }, []);

  const loadChat = async (live: Live) => {
    setSelectedLive(live);
    setLoading(true);
    try {
      const msgs = await publicApiRequest<LiveComment[]>(`/lives/${live.id}/comments?limit=100`);
      setChat(msgs);
    } catch { setChat([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!selectedLive) return;
    const t = setInterval(async () => {
      try {
        const msgs = await publicApiRequest<LiveComment[]>(`/lives/${selectedLive.id}/comments?limit=100`);
        setChat(msgs);
      } catch { /* ignore */ }
    }, 10000);
    return () => clearInterval(t);
  }, [selectedLive]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedLive) return;
    setSending(true);
    try {
      const created = await apiRequest<LiveComment>(`/lives/${selectedLive.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ clientId: "creator", userName: "Criador", message: message.trim(), isAdmin: true }),
      });
      setChat((c) => [...c, created]);
      setMessage("");
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const liveLives = lives.filter((l) => l.status === "live");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-violet-400" /> Chat das Lives
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Interage com a tua audiência em tempo real</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#1E1E2A]">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Minhas Lives</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#1E1E2A]">
            {liveLives.length > 0 && liveLives.map((live) => (
              <button key={live.id} onClick={() => loadChat(live)}
                className={`w-full text-left p-3 hover:bg-[#111118] transition-colors ${selectedLive?.id === live.id ? "bg-violet-500/5 border-l-2 border-l-violet-500" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse flex-shrink-0" />
                  <p className="text-xs font-semibold text-white truncate">{live.title}</p>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5 ml-3.5"><Eye className="w-3 h-3 inline mr-1" />{formatNumber(live.viewerCount)}</p>
              </button>
            ))}
            {lives.filter((l) => l.status !== "live").map((live) => (
              <button key={live.id} onClick={() => loadChat(live)}
                className={`w-full text-left p-3 hover:bg-[#111118] transition-colors ${selectedLive?.id === live.id ? "bg-violet-500/5 border-l-2 border-l-violet-500" : ""}`}>
                <p className="text-xs font-semibold text-gray-400 truncate">{live.title}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{live.status}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden flex flex-col">
          {selectedLive ? (
            <>
              <div className="p-3 border-b border-[#1E1E2A] flex items-center gap-2">
                {selectedLive.status === "live" && <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />}
                <p className="text-sm font-bold text-white truncate">{selectedLive.title}</p>
                <span className="ml-auto text-xs text-gray-500">{chat.length} msgs</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-gray-600 animate-spin" /></div>
                  : chat.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-2 ${msg.admin ? "bg-violet-500/10 rounded-xl p-2 border border-violet-500/20" : ""}`}>
                      {msg.admin && <Shield className="w-3 h-3 text-violet-400 flex-shrink-0 mt-0.5" />}
                      <div>
                        <span className={`text-xs font-black mr-2 ${msg.admin ? "text-violet-400" : chatColor(msg.userName)}`}>
                          {msg.admin ? "⚡ Tu (Criador)" : msg.userName}
                        </span>
                        <span className="text-xs text-gray-300">{msg.message}</span>
                        <span className="text-[10px] text-gray-700 ml-2">{timeAgo(msg.createdAt)}</span>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="p-3 border-t border-[#1E1E2A] flex gap-2">
                <input value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Responde à tua audiência..."
                  className="flex-1 bg-[#111118] border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500/60 outline-none" />
                <button onClick={sendMessage} disabled={sending || !message.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Seleciona uma live para ver o chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
