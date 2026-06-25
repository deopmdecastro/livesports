"use client";

import { Bell, CheckCircle, AlertCircle, Info, Zap } from "lucide-react";

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "live", title: "Live iniciou", message: "A tua live 'Champions League - Final' começou com 1.2K espectadores.", createdAt: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
  { id: "2", type: "success", title: "Recorde de espectadores", message: "Parabéns! Atingiste 5.000 espectadores simultâneos!", createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), read: false },
  { id: "3", type: "info", title: "Ticket respondido", message: "O suporte respondeu ao teu ticket #1234.", createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), read: true },
  { id: "4", type: "warning", title: "Live agendada em breve", message: "A tua live 'Série A - Rodada 38' começa em 30 minutos.", createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), read: true },
];

const TYPE_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  live: { icon: Zap, color: "text-[#E50914]", bg: "bg-[#E50914]/10" },
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  warning: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export default function CreatorNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-400" /> Notificações
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{MOCK_NOTIFICATIONS.filter((n) => !n.read).length} não lidas</p>
        </div>
        <button className="text-xs text-violet-400 hover:underline">Marcar todas como lidas</button>
      </div>

      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden divide-y divide-[#1E1E2A]">
        {MOCK_NOTIFICATIONS.map((notif) => {
          const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
          const Icon = style.icon;
          return (
            <div key={notif.id} className={`flex items-start gap-4 p-4 transition-colors hover:bg-[#111118] ${!notif.read ? "bg-violet-500/5" : ""}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-bold ${!notif.read ? "text-white" : "text-gray-300"}`}>{notif.title}</p>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-gray-700 mt-1">{timeAgo(notif.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
