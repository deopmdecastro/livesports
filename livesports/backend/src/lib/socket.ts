import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function initIO(server: Server): void {
  ioInstance = server;
}

export function getIO(): Server {
  if (!ioInstance) throw new Error('Socket.IO not initialised — call initIO() first');
  return ioInstance;
}
