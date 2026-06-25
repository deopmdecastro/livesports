import { Router, Request, Response } from "express";
import { getIO } from "../lib/socket";

const router = Router();

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  liveId: string;
  question: string;
  options: PollOption[];
  status: "active" | "ended";
  totalVotes: number;
  createdAt: string;
  endsAt?: string;
  votedClients: Set<string>;
}

// In-memory poll store (replace with DB in production)
export const pollsStore = new Map<string, Poll>();
let pollIdCounter = 1;

function toPublic(poll: Poll): Omit<Poll, "votedClients"> {
  const { votedClients, ...rest } = poll;
  return rest;
}

// GET /lives/:liveId/polls
router.get("/lives/:liveId/polls", (req: Request, res: Response) => {
  const { liveId } = req.params;
  const polls = Array.from(pollsStore.values())
    .filter((p) => p.liveId === liveId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(toPublic);
  res.json(polls);
});

// GET /lives/:liveId/polls/active
router.get("/lives/:liveId/polls/active", (req: Request, res: Response) => {
  const { liveId } = req.params;
  const active = Array.from(pollsStore.values()).find(
    (p) => p.liveId === liveId && p.status === "active"
  );
  res.json(active ? toPublic(active) : null);
});

// POST /lives/:liveId/polls — create a new poll
router.post("/lives/:liveId/polls", (req: Request, res: Response) => {
  const { liveId } = req.params;
  const { question, options, endsInMinutes = 5 } = req.body;

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ error: "Pergunta e pelo menos 2 opções são obrigatórias" });
  }

  const id = `poll_${Date.now()}_${pollIdCounter++}`;
  const endsAt = new Date(Date.now() + Number(endsInMinutes) * 60 * 1000).toISOString();

  const poll: Poll = {
    id,
    liveId,
    question: String(question).slice(0, 200),
    options: (options as string[]).slice(0, 6).map((text, i) => ({
      id: `opt_${i}`,
      text: String(text).slice(0, 100),
      votes: 0,
    })),
    status: "active",
    totalVotes: 0,
    createdAt: new Date().toISOString(),
    endsAt,
    votedClients: new Set(),
  };

  pollsStore.set(id, poll);

  // Broadcast new poll to everyone in the live room
  try {
    getIO().to(`live-${liveId}`).emit("poll-new", toPublic(poll));
  } catch {
    // IO not yet initialised (dev startup race) — silently ignore
  }

  // Auto-end after duration
  setTimeout(() => {
    const p = pollsStore.get(id);
    if (p && p.status === "active") {
      p.status = "ended";
      try {
        getIO().to(`live-${liveId}`).emit("poll-ended", toPublic(p));
      } catch { /* ignore */ }
    }
  }, Number(endsInMinutes) * 60 * 1000);

  res.status(201).json(toPublic(poll));
});

// POST /lives/:liveId/polls/:pollId/vote — REST fallback vote endpoint
router.post("/lives/:liveId/polls/:pollId/vote", (req: Request, res: Response) => {
  const { liveId, pollId } = req.params;
  const { optionId, clientId = "anon" } = req.body;

  const poll = pollsStore.get(pollId);
  if (!poll) return res.status(404).json({ error: "Sondagem não encontrada" });
  if (poll.status === "ended") return res.status(400).json({ error: "Sondagem encerrada" });
  if (poll.votedClients.has(String(clientId))) {
    return res.status(409).json({ error: "Já votaste nesta sondagem" });
  }

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return res.status(400).json({ error: "Opção inválida" });

  option.votes += 1;
  poll.totalVotes += 1;
  poll.votedClients.add(String(clientId));

  const pub = toPublic(poll);

  // Broadcast updated results to the live room
  try {
    getIO().to(`live-${liveId}`).emit("poll-update", pub);
  } catch { /* ignore */ }

  res.json(pub);
});

// POST /polls/:pollId/end
router.post("/polls/:pollId/end", (req: Request, res: Response) => {
  const { pollId } = req.params;
  const poll = pollsStore.get(pollId);
  if (!poll) return res.status(404).json({ error: "Sondagem não encontrada" });

  poll.status = "ended";
  const pub = toPublic(poll);

  try {
    getIO().to(`live-${poll.liveId}`).emit("poll-ended", pub);
  } catch { /* ignore */ }

  res.json(pub);
});

// DELETE /polls/:pollId
router.delete("/polls/:pollId", (req: Request, res: Response) => {
  const { pollId } = req.params;
  if (!pollsStore.has(pollId)) return res.status(404).json({ error: "Sondagem não encontrada" });
  pollsStore.delete(pollId);
  res.json({ success: true });
});

export default router;
