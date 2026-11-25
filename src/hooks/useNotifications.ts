"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  meta: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await apiRequest<{ items: Notification[]; unreadCount: number }>('/notifications');
      if (!mounted.current) return;
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
    } catch {}
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const notif = notifications.find((n) => n.id === id);
      return notif && !notif.read ? Math.max(0, prev - 1) : prev;
    });
    try {
      await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
    } catch {}
  }, [notifications]);

  // Initial fetch
  useEffect(() => {
    mounted.current = true;
    fetchNotifications();
    return () => { mounted.current = false; };
  }, [fetchNotifications]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!userId) return;

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('livesports.accessToken') || undefined
      : undefined;

    const socket = getSocket();
    if (token) { socket.auth = { token }; if (socket.connected) socket.disconnect(); }
    if (!socket.connected) socket.connect();

    // Join user room for private notifications
    const join = () => socket.emit('join-user', userId);
    socket.on('connect', join);
    if (socket.connected) join();

    const onNotification = (payload: Notification) => {
      if (!mounted.current) return;
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === payload.id);
        if (exists) return prev;
        return [payload, ...prev];
      });
      if (!payload.read) {
        setUnreadCount((prev) => prev + 1);
        toast(`${payload.title}${payload.message ? ` — ${payload.message}` : ''}`, { icon: '🔔', id: payload.id, duration: 5000 });
      }
    };
    socket.on('notification', onNotification);

    return () => {
      socket.off('notification', onNotification);
      socket.off('connect', join);
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
  };
}
