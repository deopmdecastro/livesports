/**
 * Shared Socket.IO singleton so routes can broadcast events
 * without importing from index.ts (circular deps).
 *
 * Usage:
 *   import { getIo } from '../lib/socket';
 *   getIo().to('admin-room').emit('notification', payload);
 */

import type { Server } from 'socket.io';

let _io: Server | null = null;

export function setIo(io: Server): void {
  _io = io;
}

export function getIo(): Server {
  if (!_io) throw new Error('Socket.IO not initialized — call setIo(io) first');
  return _io;
}

/** Broadcast a notification to the admin room */
export function emitToAdmins(event: string, payload: unknown): void {
  try { _io?.to('admin-room').emit(event, payload); } catch {}
}

/** Broadcast a notification to a specific user's room */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  try { _io?.to(`user-${userId}`).emit(event, payload); } catch {}
}
