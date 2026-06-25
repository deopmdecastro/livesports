import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  liveId: string;
  question: string;
  options: PollOption[];
  status: "active" | "ended";
  totalVotes: number;
  createdAt: Date;
  endsAt?: Date;
}

// In-memory poll store (replace with DB in production)
const pollsStore: Map<string, Poll> = new Map();
let pollIdCounter = 1;

// GET /lives/:liveId/polls
router.get("/lives/:liveId/polls", async (req: Request, res: Response) => {
  try {
    const { liveId } = req.params;
    const polls = Array.from(pollsStore.values())
      .filter((p) => p.liveId === liveId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar sondagens" });
  }
});

// POST /lives/:liveId/polls
router.post("/lives/:liveId/polls", async (req: Request, res: Response) => {
  try {
    const { liveId } = req.params;
    const { question, options, endsInMinutes = 5 } = req.body;

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ error: "Pergunta e pelo menos 2 opções são obrigatórias" });
    }

    const id = `poll_${Date.now()}_${pollIdCounter++}`;
    const endsAt = new Date(Date.now() + endsInMinutes * 60 * 1000);

    const poll: Poll = {
      id,
      liveId,
      question,
      options: (options as string[]).map((text, i) => ({
        id: `opt_${i}`,
        text,
        votes: 0,
      })),
      status: "active",
      totalVotes: 0,
      createdAt: new Date(),
      endsAt,
    };

    pollsStore.set(id, poll);

    // Auto-end after duration
    setTimeout(() => {
      const p = pollsStore.get(id);
      if (p && p.status === "active") {
        p.status = "ended";
        pollsStore.set(id, p);
      }
    }, endsInMinutes * 60 * 1000);

    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar sondagem" });
  }
});

// POST /lives/:liveId/polls/:pollId/vote
router.post("/lives/:liveId/polls/:pollId/vote", async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const { optionId, clientId } = req.body;

    const poll = pollsStore.get(pollId);
    if (!poll) return res.status(404).json({ error: "Sondagem não encontrada" });
    if (poll.status === "ended") return res.status(400).json({ error: "Sondagem encerrada" });

    const option = poll.options.find((o) => o.id === optionId);
    if (!option) return res.status(400).json({ error: "Opção inválida" });

    option.votes += 1;
    poll.totalVotes += 1;
    pollsStore.set(pollId, poll);

    res.json(poll);
  } catch (error) {
    res.status(500).json({ error: "Erro ao votar" });
  }
});

// POST /polls/:pollId/end
router.post("/polls/:pollId/end", async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const poll = pollsStore.get(pollId);
    if (!poll) return res.status(404).json({ error: "Sondagem não encontrada" });

    poll.status = "ended";
    pollsStore.set(pollId, poll);

    res.json(poll);
  } catch (error) {
    res.status(500).json({ error: "Erro ao encerrar sondagem" });
  }
});

// DELETE /polls/:pollId
router.delete("/polls/:pollId", async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    if (!pollsStore.has(pollId)) return res.status(404).json({ error: "Sondagem não encontrada" });

    pollsStore.delete(pollId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao eliminar sondagem" });
  }
});

export default router;
