import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Agora mesmo';
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    football: 'Futebol',
    basketball: 'Basquete',
    tennis: 'Tênis',
    ufc: 'UFC',
    f1: 'Fórmula 1',
    volleyball: 'Vôlei',
    baseball: 'Beisebol',
    other: 'Outros',
  };
  return labels[sport] || sport;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    live: 'bg-red-500 text-white',
    active: 'bg-green-500 text-white',
    scheduled: 'bg-red-500 text-white',
    ended: 'bg-gray-500 text-white',
    paused: 'bg-yellow-500 text-black',
    cancelled: 'bg-red-700 text-white',
    suspended: 'bg-orange-500 text-white',
    banned: 'bg-red-800 text-white',
    pending: 'bg-yellow-600 text-white',
    expired: 'bg-gray-600 text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle — ensures a function is called at most once per `wait` ms.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    if (remaining <= 0) {
      lastCall = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get initials from a name (e.g., "Cristiano Ronaldo" → "CR").
 */
export function getInitials(name: string, maxLen = 2): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, maxLen)
    .join('')
    .toUpperCase();
}

/**
 * Safely parse JSON, returning the fallback on failure.
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Check if code is running on the client (browser).
 */
export const isClient = typeof window !== 'undefined';

/**
 * Check if code is running on the server.
 */
export const isServer = typeof window === 'undefined';
