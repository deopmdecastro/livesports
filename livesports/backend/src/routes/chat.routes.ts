import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin, requireEditor, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// ── GET /api/chat/:liveId/messages — get chat messages (admin panel)
router.get('/:liveId/messages', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM live_comments WHERE live_id=$1 ORDER BY created_at DESC LIMIT $2`,
      req.params.liveId, limit
    );
    res.json({ success: true, data: rows.reverse() });
  } catch (error) { next(error); }
});

// ── POST /api/chat/:liveId/admin-message — admin sends a message
router.post('/:liveId/admin-message', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ success: false, error: 'Mensagem vazia.' });
      return;
    }
    const adminName = req.user?.name || 'Admin';
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO live_comments (live_id, user_name, message, admin)
       VALUES ($1,$2,$3,true) RETURNING *`,
      req.params.liveId, `🛡️ ${adminName}`, message.trim()
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
});

// ── DELETE /api/chat/:liveId/messages/:messageId — delete chat message
router.delete('/:liveId/messages/:messageId', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM live_comments WHERE id=$1 AND live_id=$2`,
      req.params.messageId, req.params.liveId
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── POST /api/chat/:liveId/pin — pin a message
router.post('/:liveId/pin', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ success: false, error: 'Mensagem obrigatória.' });
      return;
    }
    // Deactivate previous pins
    await prisma.$executeRawUnsafe(
      `UPDATE live_chat_pins SET active=false WHERE live_id=$1`, req.params.liveId
    );
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO live_chat_pins (live_id, message, pinned_by, active)
       VALUES ($1,$2,$3,true) RETURNING *`,
      req.params.liveId, message.trim(), req.user!.id
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
});

// ── GET /api/chat/:liveId/pin — get active pinned message
router.get('/:liveId/pin', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM live_chat_pins WHERE live_id=$1 AND active=true ORDER BY created_at DESC LIMIT 1`,
      req.params.liveId
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (error) { next(error); }
});

// ── DELETE /api/chat/:liveId/pin — remove pinned message
router.delete('/:liveId/pin', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE live_chat_pins SET active=false WHERE live_id=$1`, req.params.liveId
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── GET /api/chat/:liveId/stats — chat stats for admin
router.get('/:liveId/stats', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        COUNT(*)::bigint as total_messages,
        COUNT(*) FILTER (WHERE admin=true)::bigint as admin_messages,
        COUNT(DISTINCT user_name)::bigint as unique_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '5 minutes')::bigint as recent_messages
       FROM live_comments WHERE live_id=$1`,
      req.params.liveId
    );
    const r = rows[0] || {};
    res.json({
      success: true,
      data: {
        totalMessages: Number(r.total_messages || 0),
        adminMessages: Number(r.admin_messages || 0),
        uniqueUsers: Number(r.unique_users || 0),
        recentMessages: Number(r.recent_messages || 0),
      },
    });
  } catch (error) { next(error); }
});

export default router;
