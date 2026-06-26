"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, X, Check, CheckCheck, Trash2,
  Ticket, BarChart2, Tv2, AlertCircle, Info,
} from 'lucide-react';
import { cn } from '@/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  new_ticket:           { icon: Ticket,       color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ticket_reply:         { icon: Ticket,       color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  ticket_status_change: { icon: Ticket,       color: 'text-green-400',  bg: 'bg-green-500/10'  },
  poll_milestone:       { icon: BarChart2,    color: 'text-purple-400', bg: 'bg-purple-500/10' },
  creator_application:  { icon: Tv2,          color: 'text-orange-400', bg: 'bg-orange-500/10' },
  channel_status_change:{ icon: Tv2,          color: 'text-red-400',    bg: 'bg-red-500/10'    },
  system:               { icon: Info,         color: 'text-gray-400',   bg: 'bg-gray-500/10'   },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora mesmo';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function NotifItem({
  notif,
  onRead,
  onDelete,
  onClose,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
  const Icon = cfg.icon;

  const content = (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-3 transition-colors',
        notif.read ? 'hover:bg-white/[0.02]' : 'bg-[#E50914]/[0.03] hover:bg-[#E50914]/[0.06]',
      )}
    >
      <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
        <Icon className={cn('h-4 w-4', cfg.color)} />
      </div>

      <div className='min-w-0 flex-1'>
        <p className={cn('text-sm leading-snug', notif.read ? 'text-gray-300' : 'font-semibold text-white')}>
          {notif.title}
        </p>
        {notif.message && (
          <p className='mt-0.5 truncate text-[11px] text-gray-500'>{notif.message}</p>
        )}
        <p className='mt-1 text-[10px] text-gray-600'>{timeAgo(notif.createdAt)}</p>
      </div>

      <div className='flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
        {!notif.read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead(notif.id); }}
            title='Marcar como lido'
            className='rounded p-1 text-gray-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors'
          >
            <Check className='h-3.5 w-3.5' />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(notif.id); }}
          title='Eliminar'
          className='rounded p-1 text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors'
        >
          <Trash2 className='h-3.5 w-3.5' />
        </button>
        {!notif.read && (
          <span className='ml-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#E50914]' />
        )}
      </div>
    </div>
  );

  if (notif.link) {
    return (
      <Link href={notif.link} onClick={() => { onRead(notif.id); onClose(); }}>
        {content}
      </Link>
    );
  }
  return <div onClick={() => !notif.read && onRead(notif.id)}>{content}</div>;
}

export default function NotificationBell({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markAsRead, markAllRead, deleteNotification } = useNotifications(userId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Play a subtle sound / pulse when new unread arrives — just a visual flash
  const prevUnread = useRef(unreadCount);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  return (
    <div ref={ref} className='relative'>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
          open
            ? 'border-[#E50914]/40 bg-[#E50914]/10 text-[#E50914]'
            : 'border-[#1E1E2A] bg-transparent text-gray-400 hover:border-[#E50914]/20 hover:text-white',
          flash && 'animate-pulse',
        )}
        aria-label='Notificações'
      >
        <Bell className='h-4 w-4' />
        {unreadCount > 0 && (
          <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E50914] text-[9px] font-black text-white'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 top-full z-50 mt-2 w-80 animate-fade-in-up overflow-hidden rounded-xl border border-[#1E1E2A] bg-[#0A0A0F] shadow-2xl'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-[#1E1E2A] px-4 py-3'>
            <div className='flex items-center gap-2'>
              <Bell className='h-4 w-4 text-[#E50914]' />
              <span className='text-sm font-bold text-white'>Notificações</span>
              {unreadCount > 0 && (
                <span className='rounded-full bg-[#E50914]/20 px-1.5 py-0.5 text-[9px] font-black text-[#E50914]'>
                  {unreadCount} novas
                </span>
              )}
            </div>
            <div className='flex items-center gap-1'>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title='Marcar todas como lidas'
                  className='flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-400 hover:bg-[#1A1A2A] hover:text-emerald-400 transition-colors'
                >
                  <CheckCheck className='h-3.5 w-3.5' />
                  Todas lidas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className='rounded-lg p-1 text-gray-600 hover:text-white hover:bg-[#1A1A2A] transition-colors'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className='max-h-80 overflow-y-auto divide-y divide-[#111118]'>
            {loading && notifications.length === 0 ? (
              <div className='flex items-center justify-center py-8'>
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-[#E50914] border-t-transparent' />
              </div>
            ) : notifications.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-2 py-10 text-gray-600'>
                <Bell className='h-8 w-8 opacity-20' />
                <p className='text-sm'>Sem notificações</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className='border-t border-[#1E1E2A] px-4 py-2 text-center'>
              <span className='text-[10px] text-gray-600'>
                {notifications.length} notificação(ões) · apenas as últimas 30
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
