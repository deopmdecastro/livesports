// Real-time viewer tracking shared between the Socket.IO layer (index.ts) and
// REST routes (e.g. public stats). Kept in its own module so routes can read
// live counts without importing from index.ts (which would create a cycle).

// liveId → Set of connected socketIds
const viewerRooms = new Map<string, Set<string>>();

export function addViewer(liveId: string, socketId: string): number {
  if (!viewerRooms.has(liveId)) viewerRooms.set(liveId, new Set());
  viewerRooms.get(liveId)!.add(socketId);
  return viewerRooms.get(liveId)!.size;
}

export function removeViewer(liveId: string, socketId: string): number {
  const room = viewerRooms.get(liveId);
  if (!room) return 0;
  room.delete(socketId);
  if (room.size === 0) viewerRooms.delete(liveId);
  return room.size;
}

export function getViewerCount(liveId: string): number {
  return viewerRooms.get(liveId)?.size ?? 0;
}

// Total distinct socket connections across every live room — i.e. the number of
// people currently watching something live, in real time.
export function getTotalViewers(): number {
  let total = 0;
  for (const room of viewerRooms.values()) total += room.size;
  return total;
}

// Number of live rooms that currently have at least one connected viewer.
export function getActiveRoomCount(): number {
  return viewerRooms.size;
}
