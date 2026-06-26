import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// ── GET /api/notifications — get my notifications
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const unreadOnly = req.query.unread === 'true';

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM notifications
       WHERE user_id = $1 ${unreadOnly ? "AND read = false" : ""}
       ORDER BY created_at DESC
       LIMIT $2`,
      req.user!.id, limit
    );

    const unreadCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint as count FROM notifications WHERE user_id = $1 AND read = false`,
      req.user!.id
    );

    res.json({
      success: true,
      data: {
        items: rows.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          meta: n.meta || {},
          read: n.read,
          readAt: n.read_at,
          createdAt: n.created_at,
        })),
        unreadCount: Number(unreadCount[0]?.count || 0),
      },
    });
  } catch (error) { next(error); }
});

// ── PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE notifications SET read=true, read_at=NOW() WHERE id=$1 AND user_id=$2`,
      req.params.id, req.user!.id
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE notifications SET read=true, read_at=NOW() WHERE user_id=$1 AND read=false`,
      req.user!.id
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── DELETE /api/notifications/:id — delete one
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM notifications WHERE id=$1 AND user_id=$2`,
      req.params.id, req.user!.id
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── DELETE /api/notifications/clear-read — clear all read
router.delete('/clear-read', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM notifications WHERE user_id=$1 AND read=true`,
      req.user!.id
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ─── Helper: create a notification and optionally emit via Socket.IO ──────────
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO notifications (user_id, type, title, message, link, meta)
       VALUES ($1,$2::notification_type,$3,$4,$5,$6::jsonb) RETURNING *`,
      params.userId, params.type, params.title,
      params.message || null, params.link || null,
      JSON.stringify(params.meta || {})
    );
    // Emit real-time event to the user's room
    try {
      const { emitToUser } = await import('../lib/socket');
      emitToUser(params.userId, 'notification', {
        id: rows[0].id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        meta: params.meta || {},
        read: false,
        createdAt: rows[0].created_at,
      });
    } catch {}
  } catch (err) {
    // Silently fail — notifications are non-critical
  }
}

/** Create a notification for all users with admin/editor/moderator roles */
export async function notifyAdmins(params: {
  type: string;
  title: string;
  message?: string;
  link?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admins = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM users WHERE role IN ('super_admin','admin','editor','moderator') AND status='active'`
    );
    await Promise.allSettled(
      admins.map((a) => createNotification({ userId: a.id, ...params }))
    );
    // Also emit to the generic admin room for any connected admin
    try {
      const { emitToAdmins } = await import('../lib/socket');
      emitToAdmins('notification', {
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        meta: params.meta || {},
        createdAt: new Date().toISOString(),
      });
    } catch {}
  } catch {}
}

export default router;
