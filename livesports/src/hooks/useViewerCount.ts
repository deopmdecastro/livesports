"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
    : "";

/**
 * Connects to the Socket.IO server and tracks the live viewer count
 * for a specific live stream in real-time.
 *
 * @param liveId  - The live stream ID to join
 * @param initial - Initial viewer count (from SSR/API, used until socket updates)
 */
export function useViewerCount(liveId: string, initial: number = 0) {
  const [count, setCount] = useState(initial);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Keep initial in sync if the API later provides a better value
  useEffect(() => {
    if (!connected) setCount(initial);
  }, [initial, connected]);

  useEffect(() => {
    if (!liveId || !SOCKET_URL) return;

    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-live", liveId);
    });

    socket.on("viewer-count", (data: { liveId: string; count: number }) => {
      if (data.liveId === liveId) {
        setCount(Math.max(1, data.count));
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("reconnect", () => {
      setConnected(true);
      socket.emit("join-live", liveId);
    });

    return () => {
      socket.emit("leave-live", liveId);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [liveId]);

  return { count, connected };
}
