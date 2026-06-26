import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin, requireEditor, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { notifyAdmins, createNotification } from './notifications.routes';

const router = Router();

const pollSchema = z.object({
  live_id: z.string().optional().nullable(),
  question: z.string().trim().min(3).max(500),
  options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
  duration_sec: z.number().int().min(10).max(3600).default(60),
});

function mapPoll(poll: any, options: any[]) {
  const totalVotes = options.reduce((sum, o) => sum + Number(o.vote_count || 0), 0);
  return {
    id: poll.id,
    liveId: poll.live_id,
    question: poll.question,
    status: poll.status,
    durationSec: poll.duration_sec,
    endsAt: poll.ends_at,
    createdAt: poll.created_at,
    createdBy: poll.created_by,
    totalVotes,
    options: options
      .sort((a, b) => a.order_index - b.order_index)
      .map((o) => ({
        id: o.id,
        label: o.label,
        voteCount: Number(o.vote_count || 0),
        percentage: totalVotes > 0 ? Math.round((Number(o.vote_count || 0) / totalVotes) * 100) : 0,
      })),
  };
}

// ── GET /api/polls/:liveId — get active poll for a live
router.get('/:liveId', async (req, res, next) => {
  try {
    const polls = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM live_polls WHERE live_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      req.params.liveId
    );
    if (!polls[0]) {
      res.json({ success: true, data: null });
      return;
    }
    const options = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY order_index ASC`,
      polls[0].id
    );
    res.json({ success: true, data: mapPoll(polls[0], options) });
  } catch (error) { next(error); }
});

// ── GET /api/polls/admin/all — admin: list all polls
router.get('/admin/all', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const { live_id } = req.query;
    const polls = await prisma.$queryRawUnsafe<any[]>(
      live_id
        ? `SELECT * FROM live_polls WHERE live_id = $1 ORDER BY created_at DESC LIMIT 50`
        : `SELECT * FROM live_polls ORDER BY created_at DESC LIMIT 50`,
      ...(live_id ? [live_id] : [])
    );
    const result = await Promise.all(polls.map(async (p) => {
      const options = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY order_index ASC`, p.id
      );
      return mapPoll(p, options);
    }));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// ── POST /api/polls — admin: create poll
router.post('/', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const parsed = pollSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const d = parsed.data;
    const endsAt = new Date(Date.now() + d.duration_sec * 1000);

    // Close any existing active polls for this live
    if (d.live_id) {
      await prisma.$executeRawUnsafe(
        `UPDATE live_polls SET status='closed', updated_at=NOW() WHERE live_id=$1 AND status='active'`,
        d.live_id
      );
    }

    const polls = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO live_polls (live_id, created_by, question, duration_sec, ends_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      d.live_id || null, req.user!.id, d.question, d.duration_sec, endsAt
    );
    const poll = polls[0];

    // Insert options
    const options: any[] = [];
    for (let i = 0; i < d.options.length; i++) {
      const opts = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO poll_options (poll_id, label, order_index) VALUES ($1,$2,$3) RETURNING *`,
        poll.id, d.options[i], i
      );
      options.push(opts[0]);
    }

    res.status(201).json({ success: true, data: mapPoll(poll, options) });
  } catch (error) { next(error); }
});

// ── POST /api/polls/:id/vote — vote on poll
router.post('/:id/vote', async (req, res, next) => {
  try {
    const { option_id, client_id } = req.body;
    if (!option_id) {
      res.status(400).json({ success: false, error: 'option_id obrigatório' });
      return;
    }

    // Check poll is still active
    const polls = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM live_polls WHERE id=$1 AND status='active' LIMIT 1`, req.params.id
    );
    if (!polls[0]) {
      res.status(400).json({ success: false, error: 'Sondagem não está ativa.' });
      return;
    }
    if (polls[0].ends_at && new Date(polls[0].ends_at) < new Date()) {
      await prisma.$executeRawUnsafe(`UPDATE live_polls SET status='closed' WHERE id=$1`, req.params.id);
      res.status(400).json({ success: false, error: 'Sondagem já terminou.' });
      return;
    }

    // Check duplicate vote
    const identifier = client_id || 'anon';
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO poll_votes (poll_id, option_id, client_id)
         VALUES ($1,$2,$3)`,
        req.params.id, option_id, identifier
      );
    } catch {
      res.status(409).json({ success: false, error: 'Já votaste nesta sondagem.' });
      return;
    }

    // Increment vote count
    await prisma.$executeRawUnsafe(
      `UPDATE poll_options SET vote_count = vote_count + 1 WHERE id=$1 AND poll_id=$2`,
      option_id, req.params.id
    );

    const options = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM poll_options WHERE poll_id=$1 ORDER BY order_index ASC`, req.params.id
    );
    const updatedPoll = mapPoll(polls[0], options);

    // Fire-and-forget: notify on vote milestones (10, 50, 100, 500, 1000)
    const MILESTONES = [10, 50, 100, 500, 1000];
    const total = updatedPoll.totalVotes;
    if (MILESTONES.includes(total)) {
      notifyAdmins({
        type: 'poll_milestone',
        title: `📊 Sondagem atingiu ${total} votos!`,
        message: `"${updatedPoll.question}" — ${total} votos registados`,
        link: `/admin/polls`,
        meta: { pollId: req.params.id, totalVotes: total },
      }).catch(() => {});
      // Also notify the poll creator (if tracked)
      if (polls[0].created_by) {
        createNotification({
          userId: polls[0].created_by,
          type: 'poll_milestone',
          title: `📊 A tua sondagem chegou a ${total} votos!`,
          message: `"${updatedPoll.question}"`,
          link: `/creator/polls`,
          meta: { pollId: req.params.id, totalVotes: total },
        }).catch(() => {});
      }
    }

    res.json({ success: true, data: updatedPoll });
  } catch (error) { next(error); }
});

// ── PATCH /api/polls/:id/close — admin: close poll
router.patch('/:id/close', authenticateToken, requireEditor, async (_req, res, next) => {
  try {
    const polls = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE live_polls SET status='closed', updated_at=NOW() WHERE id=$1 RETURNING *`, _req.params.id
    );
    if (!polls[0]) { res.status(404).json({ success: false, error: 'Sondagem não encontrada.' }); return; }
    const options = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM poll_options WHERE poll_id=$1 ORDER BY order_index ASC`, _req.params.id
    );
    res.json({ success: true, data: mapPoll(polls[0], options) });
  } catch (error) { next(error); }
});

// ── DELETE /api/polls/:id — admin: delete poll
router.delete('/:id', authenticateToken, requireAdmin, async (_req, res, next) => {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM live_polls WHERE id=$1`, _req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
