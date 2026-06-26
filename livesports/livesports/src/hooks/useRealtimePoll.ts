"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
    : "";

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface RealtimePoll {
  id: string;
  liveId: string;
  question: string;
  options: PollOption[];
  status: "active" | "ended";
  totalVotes: number;
  createdAt: string;
  endsAt?: string;
}

const VOTED_KEY = "livesports.polls.voted";

function getVotedPolls(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) || "{}");
  } catch {
    return {};
  }
}

function markVoted(pollId: string, optionId: string): void {
  const voted = getVotedPolls();
  voted[pollId] = optionId;
  localStorage.setItem(VOTED_KEY, JSON.stringify(voted));
}

function getVotedOption(pollId: string): string | null {
  return getVotedPolls()[pollId] || null;
}

/**
 * Hook that connects to Socket.IO and provides real-time poll state for a live stream.
 * Handles voting, deduplication (localStorage), and live result updates.
 */
export function useRealtimePoll(liveId: string) {
  const [activePoll, setActivePoll] = useState<RealtimePoll | null>(null);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [voting, setVoting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Restore voted state from localStorage on mount
  useEffect(() => {
    if (activePoll) {
      setVotedOptionId(getVotedOption(activePoll.id));
    }
  }, [activePoll?.id]);

  useEffect(() => {
    if (!liveId || !SOCKET_URL) return;

    // Reuse existing socket if already connected, or create a new one
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

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("reconnect", () => {
      setConnected(true);
      socket.emit("join-live", liveId);
    });

    // A new poll was created for this live
    socket.on("poll-new", (poll: RealtimePoll) => {
      if (poll.liveId !== liveId) return;
      setActivePoll(poll);
      setVotedOptionId(getVotedOption(poll.id));
    });

    // Results updated after a vote
    socket.on("poll-update", (poll: RealtimePoll) => {
      if (poll.liveId !== liveId) return;
      setActivePoll((prev) => {
        if (!prev || prev.id !== poll.id) return prev;
        return poll;
      });
    });

    // Poll was ended by admin
    socket.on("poll-ended", (poll: RealtimePoll) => {
      if (poll.liveId !== liveId) return;
      setActivePoll(poll);
    });

    return () => {
      socket.emit("leave-live", liveId);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [liveId]);

  /**
   * Vote on an option. Emits the vote via socket AND marks as voted locally.
   */
  const vote = useCallback(
    async (pollId: string, optionId: string) => {
      if (!socketRef.current || voting) return;
      if (getVotedOption(pollId)) return; // already voted

      setVoting(true);

      // Optimistic update
      setActivePoll((prev) => {
        if (!prev || prev.id !== pollId) return prev;
        const updated: RealtimePoll = {
          ...prev,
          totalVotes: prev.totalVotes + 1,
          options: prev.options.map((o) =>
            o.id === optionId ? { ...o, votes: o.votes + 1 } : o
          ),
        };
        return updated;
      });

      setVotedOptionId(optionId);
      markVoted(pollId, optionId);

      // Emit to server
      socketRef.current.emit("poll-vote", {
        liveId,
        pollId,
        optionId,
        clientId: (typeof window !== "undefined" &&
          (window.localStorage.getItem("livesports.clientId") || "anon")) || "anon",
      });

      setVoting(false);
    },
    [liveId, voting]
  );

  const dismiss = useCallback(() => {
    setActivePoll(null);
  }, []);

  return { activePoll, votedOptionId, connected, voting, vote, dismiss };
}
