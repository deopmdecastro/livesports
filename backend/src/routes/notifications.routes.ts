import { Router } from 'express';
import { authenticateToken, AuthRequest, requireEditor } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { writeLog } from './logs.routes';

const router = Router();
const STAFF_ROLES = new Set(['admin', 'super_admin', 'moderator', 'editor']);
const ALLOWED_NOTIFICATION_TYPES = new Set([
  'info',
  'success',
  'warning',
  'error',
  'live',
  'new_ticket',
  'ticket_reply',
  'ticket_status_change',
  'poll_milestone',
  'creator_application',
  'channel_status_change',
  'system',
]);

function isStaff(role?: string | null) {
  return !!role && STAFF_ROLES.has(role);
}

function normalizeNotificationType(type?: string | null) {
  const normalized = String(type || 'system').trim().toLowerCase();
  return ALLOWED_NOTIFICATION_TYPES.has(normalized) ? normalized : 'system';
}

function mapNotificationRow(n: any) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    actionUrl: n.link,
    link: n.link,
    meta: n.meta || {},
    read: n.read,
    readAt: n.read_at,
    userId: n.user_id,
    userName: n.user_name,
    userEmail: n.user_email,
    createdAt: n.created_at,
  };
}

// ── GET /api/notifications — get my notifications
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const unreadOnly = req.query.unread === 'true';

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM notifications
       WHERE user_id = $1 ${unreadOnly ? 'AND read = false' : ''}
       ORDER BY created_at DESC
       LIMIT $2`,
      req.user!.id, limit,
    );

    const unreadCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint as count FROM notifications WHERE user_id = $1 AND read = false`,
      req.user!.id,
    );

    res.json({
      success: true,
      data: {
        items: rows.map(mapNotificationRow),
        unreadCount: Number(unreadCount[0]?.count || 0),
      },
    });
  } catch (error) { next(error); }
});

// ── GET /api/notifications/admin — list platform notifications for staff
router.get('/admin', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const q = String(req.query.q || '').trim();
    const type = String(req.query.type || '').trim().toLowerCase();
    const unreadOnly = req.query.unread === 'true';
    const userId = String(req.query.userId || '').trim();

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (type && type !== 'all') {
      values.push(normalizeNotificationType(type));
      conditions.push(`n.type = $${values.length}::notification_type`);
    }
    if (unreadOnly) {
      conditions.push('n.read = false');
    }
    if (userId) {
      values.push(userId);
      conditions.push(`n.user_id = $${values.length}`);
    }
    if (q) {
      values.push(`%${q}%`);
      conditions.push(`(n.title ILIKE $${values.length} OR COALESCE(n.message, '') ILIKE $${values.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, summaryRows, byTypeRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT n.*, u.name AS user_name, u.email AS user_email
         FROM "notifications" n
         LEFT JOIN "users" u ON u.id = n.user_id
         ${where}
         ORDER BY n.created_at DESC
         LIMIT $${values.length + 1}`,
        ...values,
        limit,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT
           COUNT(*)::bigint AS total,
           COUNT(*) FILTER (WHERE read = false)::bigint AS unread,
           COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::bigint AS today
         FROM "notifications" n
         ${where}`,
        ...values,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT n.type::text AS type, COUNT(*)::bigint AS count
         FROM "notifications" n
         ${where}
         GROUP BY n.type
         ORDER BY count DESC`,
        ...values,
      ),
    ]);

    const summary = summaryRows[0] || {};
    res.json({
      success: true,
      data: {
        items: rows.map(mapNotificationRow),
        summary: {
          total: Number(summary.total || 0),
          unread: Number(summary.unread || 0),
          today: Number(summary.today || 0),
          byType: byTypeRows.reduce((acc, row) => {
            acc[row.type] = Number(row.count || 0);
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  } catch (error) { next(error); }
});

// ── POST /api/notifications/send — send platform notification
router.post('/send', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const title = String(req.body?.title || '').trim();
    const message = String(req.body?.message || '').trim();
    const type = normalizeNotificationType(req.body?.type);
    const userId = String(req.body?.userId || '').trim();
    const sendToAll = Boolean(req.body?.sendToAll) || !userId;
    const link = String(req.body?.actionUrl || req.body?.link || '').trim() || undefined;

    if (!title || !message) {
      res.status(400).json({ success: false, error: 'Titulo e mensagem sao obrigatorios' });
      return;
    }

    const recipients = sendToAll
      ? await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM "users" WHERE status = 'active' ORDER BY created_at DESC LIMIT 5000`,
        )
      : await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM "users" WHERE id = $1 LIMIT 1`,
          userId,
        );

    if (recipients.length === 0) {
      res.status(404).json({ success: false, error: 'Nenhum destinatario encontrado' });
      return;
    }

    await Promise.allSettled(
      recipients.map((recipient) =>
        createNotification({
          userId: recipient.id,
          type,
          title,
          message,
          link,
          meta: {
            broadcast: sendToAll,
            createdBy: req.user?.id,
          },
        }),
      ),
    );

    await writeLog({
      level: 'info',
      service: 'admin',
      message: `Notificacao enviada: ${title}`,
      details: {
        notificationType: type,
        sendToAll,
        recipients: recipients.length,
        userId: sendToAll ? null : userId,
      },
      userId: req.user?.id,
      requestId: (req as any).requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      data: {
        sentCount: recipients.length,
        type,
        title,
      },
    });
  } catch (error) { next(error); }
});

// ── PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const staffMode = req.query.scope === 'admin' && isStaff(req.user?.role);
    await prisma.$executeRawUnsafe(
      staffMode
        ? `UPDATE notifications SET read=true, read_at=NOW() WHERE id=$1`
        : `UPDATE notifications SET read=true, read_at=NOW() WHERE id=$1 AND user_id=$2`,
      ...(staffMode ? [req.params.id] : [req.params.id, req.user!.id]),
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE notifications SET read=true, read_at=NOW() WHERE user_id=$1 AND read=false`,
      req.user!.id,
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── DELETE /api/notifications/clear-read — clear all read
router.delete('/clear-read', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM notifications WHERE user_id=$1 AND read=true`,
      req.user!.id,
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── DELETE /api/notifications/:id — delete one
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const staffMode = req.query.scope === 'admin' && isStaff(req.user?.role);
    await prisma.$executeRawUnsafe(
      staffMode
        ? `DELETE FROM notifications WHERE id=$1`
        : `DELETE FROM notifications WHERE id=$1 AND user_id=$2`,
      ...(staffMode ? [req.params.id] : [req.params.id, req.user!.id]),
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
      params.userId,
      normalizeNotificationType(params.type),
      params.title,
      params.message || null,
      params.link || null,
      JSON.stringify(params.meta || {}),
    );
    try {
      const { emitToUser } = await import('../lib/socket');
      emitToUser(params.userId, 'notification', {
        id: rows[0].id,
        type: rows[0].type,
        title: params.title,
        message: params.message,
        link: params.link,
        meta: params.meta || {},
        read: false,
        createdAt: rows[0].created_at,
      });
    } catch {}
  } catch {
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
      `SELECT id FROM users WHERE role IN ('super_admin','admin','editor','moderator') AND status='active'`,
    );
    await Promise.allSettled(
      admins.map((a) => createNotification({ userId: a.id, ...params })),
    );
    try {
      const { emitToAdmins } = await import('../lib/socket');
      emitToAdmins('notification', {
        type: normalizeNotificationType(params.type),
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
