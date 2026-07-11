"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Send, Trash2, CheckCircle, RefreshCw, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
}

interface NotificationSummary {
  total: number;
  unread: number;
  today: number;
  byType: Record<string, number>;
}

interface AdminNotificationsResponse {
  items: Notification[];
  summary: NotificationSummary;
}

const TYPE_COLORS: Record<string, string> = {
  info: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  warning: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
  error: "bg-red-500/15 text-red-400 border-red-500/20",
  live: "bg-[#E50914]/15 text-[#E50914] border-[#E50914]/20",
  new_ticket: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  ticket_reply: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20",
  ticket_status_change: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  poll_milestone: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  creator_application: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  channel_status_change: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  system: "bg-gray-500/15 text-gray-300 border-gray-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  info: "Informativa",
  success: "Sucesso",
  warning: "Alerta",
  error: "Erro",
  live: "Live",
  new_ticket: "Novo ticket",
  ticket_reply: "Resposta ticket",
  ticket_status_change: "Status ticket",
  poll_milestone: "Marco sondagem",
  creator_application: "Criador",
  channel_status_change: "Canal",
  system: "Sistema",
};

function StatusBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[type] || TYPE_COLORS.system}`}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

const emptySummary: NotificationSummary = {
  total: 0,
  unread: 0,
  today: 0,
  byType: {},
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "system",
    userId: "",
    sendToAll: true,
  });
  const [sending, setSending] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: "100", ...(filterType !== "all" ? { type: filterType } : {}) });
      const data = await apiRequest<AdminNotificationsResponse>(`/notifications/admin?${query.toString()}`);
      setNotifications(data.items || []);
      setSummary(data.summary || emptySummary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { void load(); }, [load]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Preenche título e mensagem");
      return;
    }
    setSending(true);
    try {
      const result = await apiRequest<{ sentCount: number }>("/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          userId: form.sendToAll ? "" : form.userId,
        }),
      });
      toast.success(`Notificação enviada para ${result.sentCount} destinatário(s)`);
      setShowCreate(false);
      setForm({ title: "", message: "", type: "system", userId: "", sendToAll: true });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (id: string) => {
    setProcessingId(id);
    try {
      await apiRequest(`/notifications/${id}/read?scope=admin`, { method: "PATCH" });
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
      setSummary((current) => ({ ...current, unread: Math.max(0, current.unread - 1) }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao marcar como lida");
    } finally {
      setProcessingId(null);
    }
  };

  const removeNotification = async (id: string) => {
    setProcessingId(id);
    try {
      await apiRequest(`/notifications/${id}?scope=admin`, { method: "DELETE" });
      const removed = notifications.find((item) => item.id === id);
      setNotifications((current) => current.filter((item) => item.id !== id));
      setSummary((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        unread: removed && !removed.read ? Math.max(0, current.unread - 1) : current.unread,
      }));
      toast.success("Notificação removida");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover notificação");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = notifications.filter((n) =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.message || "").toLowerCase().includes(search.toLowerCase()) ||
    (n.userName || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-white">
            <Bell className="h-5 w-5 text-[#E50914]" /> Notificações
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {summary.unread} não lidas · {summary.today} nas últimas 24h · {summary.total} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} className="rounded-lg border border-[#2A2A2A] p-2 text-gray-400 hover:bg-[#1A1A1A] hover:text-white">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B00000]">
            <Send className="h-4 w-4" /> Enviar Notificação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: summary.total, color: "text-red-400" },
          { label: "Não Lidas", value: summary.unread, color: "text-[#E50914]" },
          { label: "24h", value: summary.today, color: "text-emerald-400" },
          { label: "Tickets", value: (summary.byType.new_ticket || 0) + (summary.byType.ticket_reply || 0), color: "text-violet-300" },
          { label: "Erros", value: summary.byType.error || 0, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-3 text-center">
            <p className={`text-lg font-black ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar notificações..."
            className="input-dark w-full pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...Object.keys(TYPE_LABELS)].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                filterType === t ? "bg-[#E50914] text-white" : "border border-[#2A2A2A] bg-[#1A1A1A] text-gray-400 hover:text-white"
              }`}
            >
              {t === "all" ? "Todas" : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#E50914]" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-600">
          <Bell className="h-12 w-12 opacity-20" />
          <p className="text-sm">Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <div key={notif.id} className={`rounded-xl border p-4 transition-all ${notif.read ? "border-[#1E1E2A] bg-[#0E0E16]" : "border-[#E50914]/20 bg-[#E50914]/5"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${notif.read ? "bg-gray-600" : "bg-[#E50914]"}`} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{notif.title}</h4>
                    <StatusBadge type={notif.type} />
                  </div>
                  <p className="text-xs text-gray-400">{notif.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-gray-600">
                    <span>{new Date(notif.createdAt).toLocaleString("pt-PT")}</span>
                    {notif.userName && <span>Para: {notif.userName}</span>}
                    {notif.userEmail && <span>{notif.userEmail}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!notif.read && (
                    <button
                      onClick={() => void markAsRead(notif.id)}
                      disabled={processingId === notif.id}
                      className="cursor-pointer rounded-lg p-1 text-gray-600 transition-colors hover:text-emerald-400 disabled:opacity-40"
                      title="Marcar como lida"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => void removeNotification(notif.id)}
                    disabled={processingId === notif.id}
                    className="cursor-pointer rounded-lg p-1 text-gray-600 transition-colors hover:text-red-400 disabled:opacity-40"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
              <h3 className="flex items-center gap-2 font-black text-white"><Send className="h-4 w-4 text-[#E50914]" /> Enviar Notificação</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Título *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="Ex: Manutenção Programada" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Mensagem *</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="input-dark w-full resize-none px-3 py-2 text-sm" placeholder="Detalhes da notificação..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-dark w-full px-3 py-2 text-sm">
                    {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">Destino</label>
                  <select value={form.sendToAll ? "all" : "single"} onChange={(e) => setForm({ ...form, sendToAll: e.target.value === "all" })} className="input-dark w-full px-3 py-2 text-sm">
                    <option value="all">Todos os utilizadores</option>
                    <option value="single">Utilizador específico</option>
                  </select>
                </div>
              </div>
              {!form.sendToAll && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">ID do utilizador</label>
                  <input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="ID do utilizador" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#1E1E2A] p-4">
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-[#1E1E2A] px-4 py-2 text-sm text-gray-300">Cancelar</button>
              <button onClick={() => void handleSend()} disabled={sending} className="flex items-center gap-2 rounded-xl bg-[#E50914] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                <Send className="h-4 w-4" /> {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
