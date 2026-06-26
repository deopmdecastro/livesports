"use client";

import { Bell, CheckCircle, Info, Zap, AlertCircle } from "lucide-react";

const NOTIFICATIONS = [
  { id: "1", type: "live", title: "Live a começar", message: "Champions League — Final está prestes a começar.", time: "há 2 min", read: false },
  { id: "2", type: "info", title: "Ticket respondido", message: "O suporte respondeu ao teu pedido de ajuda.", time: "há 1h", read: false },
  { id: "3", type: "success", title: "Bem-vindo!", message: "A tua conta foi criada com sucesso. Aprecia as lives!", time: "há 2d", read: true },
];

const TYPE_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  live: { icon: Zap, color: "text-[#E50914]", bg: "bg-[#E50914]/10" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  warning: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
};

export default function UserNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Bell className="w-6 h-6 text-yellow-400" /> Notificações
          </h1>
          <p className="text-sm text-gray-400 mt-1">{NOTIFICATIONS.filter((n) => !n.read).length} não lidas</p>
        </div>
        <button className="text-xs text-[#E50914] hover:underline">Marcar todas como lidas</button>
      </div>
      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden divide-y divide-[#1E1E2A]">
        {NOTIFICATIONS.map((notif) => {
          const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
          const Icon = style.icon;
          return (
            <div key={notif.id} className={`flex items-start gap-4 p-4 ${!notif.read ? "bg-[#E50914]/5" : ""}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-bold ${!notif.read ? "text-white" : "text-gray-300"}`}>{notif.title}</p>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-[#E50914] flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-gray-700 mt-1">{notif.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
