"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Plus, Radio, X, Send, RefreshCw, CheckCircle, Trash2, Search, Users, Wifi, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { apiRequest, publicApiRequest, type ApiListResponse } from "@/lib/api";
import type { Live } from "@/types";
import { formatNumber } from "@/utils";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
    : "";

interface PollOption { id: string; text: string; votes: number; }
interface Poll {
  id: string; liveId: string; question: string; options: PollOption[];
  status: "active" | "ended"; totalVotes: number; createdAt: string; endsAt?: string;
}

function PollCard({ poll, onEnd, onDelete }: {
  poll: Poll; onEnd: (id: string) => void; onDelete: (id: string) => void;
}) {
  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);
  const leading = poll.totalVotes > 0
    ? poll.options.reduce((a, b) => b.votes > a.votes ? b : a).id
    : null;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      poll.status === "active"
        ? "border-[#E50914]/30 bg-[#E50914]/5 shadow-[0_0_16px_rgba(229,9,20,0.08)]"
        : "border-[#1E1E2A] bg-[#0E0E16]"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {poll.status === "active" ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-[#E50914] bg-[#E50914]/15 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" /> AO VIVO
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full">ENCERRADA</span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3" />{formatNumber(poll.totalVotes)} votos
            </span>
          </div>
          <p className="text-sm font-bold text-white">{poll.question}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {poll.status === "active" && (
            <button onClick={() => onEnd(poll.id)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-yellow-400 transition-colors" title="Encerrar">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onDelete(poll.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          const isLeading = opt.id === leading && poll.totalVotes > 0;
          return (
            <div key={opt.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={`font-medium ${isLeading ? "text-[#E50914]" : "text-gray-300"}`}>
                  {isLeading && "⭐ "}{opt.text}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[10px]">{opt.votes}</span>
                  <span className={`font-black ${isLeading ? "text-[#E50914]" : "text-gray-400"}`}>{pct}%</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-[#1A1A28] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isLeading ? "bg-gradient-to-r from-[#E50914] to-[#FF4550]" : "bg-[#2A2A3A]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPollsPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedLiveId, setSelectedLiveId] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ question: "", options: ["", "", ""], endsInMinutes: 5 });
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=50")
      .then((r) => setLives(r.items || []))
      .catch(() => setLives([]));
  }, []);

  // Connect to socket for live poll updates
  useEffect(() => {
    if (!SOCKET_URL) return;
    const socket: Socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("poll-update", (poll: Poll) => {
      setPolls((prev) => prev.map((p) => p.id === poll.id ? { ...p, ...poll } : p));
    });
    socket.on("poll-new", (poll: Poll) => {
      setPolls((prev) => [poll, ...prev.filter((p) => p.id !== poll.id)]);
    });
    socket.on("poll-ended", (poll: Poll) => {
      setPolls((prev) => prev.map((p) => p.id === poll.id ? { ...p, status: "ended" as const } : p));
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  // Join socket room when live is selected
  useEffect(() => {
    if (!socketRef.current || !selectedLiveId) return;
    socketRef.current.emit("join-live", selectedLiveId);
    return () => { socketRef.current?.emit("leave-live", selectedLiveId); };
  }, [selectedLiveId]);

  const loadPolls = async (liveId: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<Poll[]>(`/lives/${liveId}/polls`);
      setPolls(Array.isArray(data) ? data : []);
    } catch { setPolls([]); }
    finally { setLoading(false); }
  };

  const selectLive = (liveId: string) => {
    setSelectedLiveId(liveId);
    if (liveId) loadPolls(liveId);
    else setPolls([]);
  };

  const addOption = () => {
    if (form.options.length >= 6) return;
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  };

  const updateOption = (i: number, v: string) => {
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => idx === i ? v : o) }));
  };

  const removeOption = (i: number) => {
    if (form.options.length <= 2) return;
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  };

  const createPoll = async () => {
    if (!selectedLiveId) { toast.error("Seleciona uma live"); return; }
    if (!form.question.trim()) { toast.error("Introduz a pergunta"); return; }
    const opts = form.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) { toast.error("Mínimo 2 opções"); return; }
    try {
      await apiRequest(`/lives/${selectedLiveId}/polls`, {
        method: "POST",
        body: JSON.stringify({ question: form.question, options: opts, endsInMinutes: form.endsInMinutes }),
      });
      toast.success("Sondagem criada! 🗳️");
      setShowNew(false);
      setForm({ question: "", options: ["", "", ""], endsInMinutes: 5 });
      loadPolls(selectedLiveId);
    } catch { toast.error("Erro ao criar sondagem"); }
  };

  const endPoll = async (pollId: string) => {
    try {
      await apiRequest(`/polls/${pollId}/end`, { method: "POST" });
      toast.success("Sondagem encerrada");
      setPolls((p) => p.map((x) => x.id === pollId ? { ...x, status: "ended" as const } : x));
    } catch { toast.error("Erro ao encerrar"); }
  };

  const deletePoll = async (pollId: string) => {
    try {
      await apiRequest(`/polls/${pollId}`, { method: "DELETE" });
      toast.success("Eliminada");
      setPolls((p) => p.filter((x) => x.id !== pollId));
    } catch { toast.error("Erro ao eliminar"); }
  };

  const filteredLives = lives.filter((l) => !search || l.title.toLowerCase().includes(search.toLowerCase()));
  const liveLives = filteredLives.filter((l) => l.status === "live");
  const selectedLive = lives.find((l) => l.id === selectedLiveId);
  const activePolls = polls.filter((p) => p.status === "active");
  const endedPolls = polls.filter((p) => p.status === "ended");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#E50914]" /> Sondagens
            {socketConnected ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <Wifi className="w-3 h-3" /> Tempo Real
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-500/10 px-2 py-0.5 rounded-full">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500">Os resultados atualizam automaticamente em tempo real</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          disabled={!selectedLiveId}
          className="flex items-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-[#B00000] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Nova Sondagem
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live selector */}
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
          <div className="p-3 border-b border-[#1E1E2A]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Selecionar Live</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-[#E50914]/50 outline-none" />
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            {liveLives.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#E50914] uppercase bg-[#E50914]/5 border-b border-[#1E1E2A]">
                  Ao Vivo Agora
                </div>
                {liveLives.map((live) => (
                  <button key={live.id} onClick={() => selectLive(live.id)}
                    className={`w-full text-left p-3 hover:bg-[#111118] border-b border-[#1E1E2A]/50 transition-colors ${selectedLiveId === live.id ? "bg-[#E50914]/5 border-l-2 border-l-[#E50914]" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse flex-shrink-0" />
                      <p className="text-xs font-semibold text-white truncate">{live.title}</p>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-0.5 ml-3.5">{formatNumber(live.viewerCount)} espectadores</p>
                  </button>
                ))}
              </>
            )}
            {filteredLives.filter((l) => l.status !== "live").map((live) => (
              <button key={live.id} onClick={() => selectLive(live.id)}
                className={`w-full text-left p-3 hover:bg-[#111118] border-b border-[#1E1E2A]/50 transition-colors ${selectedLiveId === live.id ? "bg-[#E50914]/5 border-l-2 border-l-[#E50914]" : ""}`}>
                <p className="text-xs font-semibold text-gray-400 truncate">{live.title}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{live.status}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Polls panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedLive ? (
            <>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
                <Radio className="w-4 h-4 text-[#E50914]" />
                <span className="text-sm font-bold text-white flex-1">{selectedLive.title}</span>
                {selectedLive.status === "live" && <span className="text-[10px] font-black text-[#E50914] bg-[#E50914]/10 px-2 py-0.5 rounded-full">AO VIVO</span>}
                <button onClick={() => loadPolls(selectedLiveId)} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {showNew && (
                <div className="rounded-xl border border-[#E50914]/30 bg-[#0E0E16] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Nova Sondagem</h3>
                    <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3">
                    <input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                      placeholder="Qual é a tua pergunta?"
                      className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none" />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-gray-500">Opções</label>
                        <button onClick={addOption} className="text-xs text-[#E50914] hover:underline">+ Adicionar</button>
                      </div>
                      <div className="space-y-2">
                        {form.options.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input value={opt} onChange={(e) => updateOption(i, e.target.value)}
                              placeholder={`Opção ${i + 1}`}
                              className="flex-1 bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none" />
                            {form.options.length > 2 && (
                              <button onClick={() => removeOption(i)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Duração</label>
                      <select value={form.endsInMinutes} onChange={(e) => setForm((f) => ({ ...f, endsInMinutes: Number(e.target.value) }))}
                        className="w-full bg-[#111118] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E50914]/50 outline-none">
                        <option value={1}>1 minuto</option>
                        <option value={2}>2 minutos</option>
                        <option value={5}>5 minutos</option>
                        <option value={10}>10 minutos</option>
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
                      <button onClick={createPoll}
                        className="flex items-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-[#B00000] text-white text-sm font-bold rounded-xl">
                        <Send className="w-4 h-4" /> Criar Sondagem
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="w-5 h-5 text-gray-600 animate-spin" />
                </div>
              ) : (
                <>
                  {activePolls.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" />
                        Sondagens Ativas ({activePolls.length})
                        <span className="text-[10px] text-emerald-400 font-normal normal-case">· resultados ao vivo</span>
                      </h3>
                      <div className="space-y-3">
                        {activePolls.map((p) => <PollCard key={p.id} poll={p} onEnd={endPoll} onDelete={deletePoll} />)}
                      </div>
                    </div>
                  )}
                  {endedPolls.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Historial ({endedPolls.length})</h3>
                      <div className="space-y-3">
                        {endedPolls.map((p) => <PollCard key={p.id} poll={p} onEnd={endPoll} onDelete={deletePoll} />)}
                      </div>
                    </div>
                  )}
                  {polls.length === 0 && !showNew && (
                    <div className="py-12 text-center rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
                      <BarChart3 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Nenhuma sondagem para esta live</p>
                      <button onClick={() => setShowNew(true)} className="mt-2 text-xs text-[#E50914] hover:underline">Criar primeira sondagem</button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
              <BarChart3 className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Seleciona uma live para criar e ver sondagens</p>
              <p className="text-xs text-gray-600 mt-1">Os resultados atualizam em tempo real via Socket.IO</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
