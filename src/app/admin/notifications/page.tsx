"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Send, Trash2, CheckCircle, RefreshCw, Search, X, FilterIcon } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "live";
  read: boolean;
  actionUrl?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  error: "bg-red-500/15 text-red-400 border-red-500/20",
  live: "bg-[#E50914]/15 text-[#E50914] border-[#E50914]/20",
};
const TYPE_LABELS: Record<string, string> = {
  info: "Informativa", success: "Sucesso", warning: "Alerta", error: "Erro", live: "Live",
};

function StatusBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[type] || TYPE_COLORS.info}`}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "", message: "", type: "info" as const, userId: "", sendToAll: true,
  });
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ApiListResponse<Notification>>("/notifications?limit=100");
      setNotifications(data.items || []);
    } catch { toast.error("Erro ao carregar notificações"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!form.title || !form.message) { toast.error("Preenche título e mensagem"); return; }
    setSending(true);
    try {
      await apiRequest("/notifications/send", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Notificação enviada!");
      setShowCreate(false);
      setForm({ title: "", message: "", type: "info", userId: "", sendToAll: true });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally { setSending(false); }
  };

  const filtered = notifications
    .filter((n) => filterType === "all" || n.type === filterType)
    .filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    today: notifications.filter((n) => new Date(n.createdAt).toDateString() === new Date().toDateString()).length,
    byType: Object.fromEntries(TYPE_LABELS ? Object.keys(TYPE_LABELS).map((k) => [k, notifications.filter((n) => n.type === k).length]) : []),
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#E50914]" /> Notificações
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats.unread} não lidas · {stats.today} hoje · {stats.total} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A]">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] transition-colors">
            <Send className="h-4 w-4" /> Enviar Notificação
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-blue-400" },
          { label: "Não Lidas", value: stats.unread, color: "text-[#E50914]" },
          { label: "Hoje", value: stats.today, color: "text-emerald-400" },
          { label: "Sucesso", value: stats.byType?.success || 0, color: "text-emerald-400" },
          { label: "Erros", value: stats.byType?.error || 0, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-3 text-center">
            <p className={`text-lg font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar notificações..." className="input-dark w-full pl-9 pr-3 py-2 text-sm" />
        </div>
        <div className="flex gap-1.5">
          {["all", "info", "success", "warning", "error", "live"].map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                filterType === t ? "bg-[#E50914] text-white" : "bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] hover:text-white"
              }`}>
              {t === "all" ? "Todas" : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
          <Bell className="h-12 w-12 opacity-20" />
          <p className="text-sm">Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <div key={notif.id} className={`rounded-xl border p-4 transition-all ${notif.read ? "border-[#1E1E2A] bg-[#0E0E16]" : "border-[#E50914]/20 bg-[#E50914]/5"}`}>
              <div className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? "bg-gray-600" : "bg-[#E50914]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white">{notif.title}</h4>
                    <StatusBadge type={notif.type} />
                  </div>
                  <p className="text-xs text-gray-400">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-600">
                      {new Date(notif.createdAt).toLocaleString("pt-PT")}
                    </span>
                    {notif.userName && (
                      <span className="text-[10px] text-gray-600">Para: {notif.userName}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!notif.read && <CheckCircle className="h-4 w-4 text-gray-600 hover:text-emerald-400 cursor-pointer transition-colors" />}
                  <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-400 cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
              <h3 className="font-black text-white flex items-center gap-2"><Send className="h-4 w-4 text-[#E50914]" /> Enviar Notificação</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Título *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="Ex: Manutenção Programada" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Mensagem *</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="input-dark w-full resize-none px-3 py-2 text-sm" placeholder="Detalhes da notificação..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} className="input-dark w-full px-3 py-2 text-sm">
                      {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Utilizador</label>
                    <input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="ID (vazio = todos)" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#1E1E2A] p-4">
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300">Cancelar</button>
              <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                <Send className="h-4 w-4" /> {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
