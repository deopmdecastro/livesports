/**
 * Singleton Socket.IO client for the frontend.
 * Lazily connects and re-uses the same instance across the app.
 */

import { io, type Socket } from 'socket.io-client';

let _socket: Socket | null = null;

function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return base;
  }
  return 'http://localhost:3001';
}

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(getApiUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: false,
    });
  }
  return _socket;
}

export function connectSocket(token?: string): Socket {
  const socket = getSocket();
  if (token) {
    socket.auth = { token };
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (_socket?.connected) {
    _socket.disconnect();
  }
}
