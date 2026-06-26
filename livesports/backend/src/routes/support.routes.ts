import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin, requireEditor, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { parsePagination, buildPaginationMeta } from '../lib/pagination';

const router = Router();

const ticketSchema = z.object({
  subject: z.string().trim().min(3).max(500),
  description: z.string().trim().min(10),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.enum(['player', 'account', 'billing', 'stream', 'content', 'technical', 'other']).default('other'),
});

function mapTicket(row: any) {
  return {
    id: row.id,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_name,
    messageCount: Number(row.message_count || 0),
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectTicketSql = `
  SELECT t.*,
    u.name as user_name, u.email as user_email,
    a.name as assigned_name,
    (SELECT COUNT(*)::bigint FROM "support_messages" WHERE ticket_id = t.id) as message_count
  FROM "support_tickets" t
  LEFT JOIN "users" u ON u.id = t.user_id
  LEFT JOIN "users" a ON a.id = t.assigned_to
`;

// GET /api/support — list tickets (admin/editor only)
router.get('/', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const { status, priority, category } = req.query;
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (status) { values.push(status); conditions.push(`t.status = $${values.length}::ticket_status`); }
    if (priority) { values.push(priority); conditions.push(`t.priority = $${values.length}::ticket_priority`); }
    if (category) { values.push(category); conditions.push(`t.category = $${values.length}::ticket_category`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `${selectTicketSql} ${where} ORDER BY
          CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
          t.created_at DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        ...values, pagination.limit, pagination.offset
      ),
      prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint AS total FROM "support_tickets" t ${where}`,
        ...values
      ),
    ]);

    const total = Number(countRows[0]?.total || 0);
    res.json({
      success: true,
      data: { items: rows.map(mapTicket), pagination: buildPaginationMeta(pagination, total) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/support/stats
router.get('/stats', authenticateToken, requireEditor, async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*)::bigint as total,
        COUNT(*) FILTER (WHERE status = 'open')::bigint as open,
        COUNT(*) FILTER (WHERE status = 'pending')::bigint as pending,
        COUNT(*) FILTER (WHERE status = 'resolved')::bigint as resolved,
        COUNT(*) FILTER (WHERE status = 'closed')::bigint as closed,
        COUNT(*) FILTER (WHERE priority = 'critical')::bigint as critical,
        COUNT(*) FILTER (WHERE priority = 'high')::bigint as high_priority
      FROM "support_tickets"
    `);
    const r = rows[0] || {};
    res.json({
      success: true,
      data: {
        total: Number(r.total || 0),
        open: Number(r.open || 0),
        pending: Number(r.pending || 0),
        resolved: Number(r.resolved || 0),
        closed: Number(r.closed || 0),
        critical: Number(r.critical || 0),
        highPriority: Number(r.high_priority || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/support/:id
router.get('/:id', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectTicketSql} WHERE t.id = $1 LIMIT 1`, req.params.id
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'Ticket não encontrado' }); return; }

    const messages = await prisma.$queryRawUnsafe<any[]>(
      `SELECT m.*, u.name as user_name, u.email as user_email
       FROM "support_messages" m
       LEFT JOIN "users" u ON u.id = m.user_id
       WHERE m.ticket_id = $1
       ORDER BY m.created_at ASC`,
      req.params.id
    );

    res.json({
      success: true,
      data: {
        ...mapTicket(rows[0]),
        messages: messages.map((m) => ({
          id: m.id, ticketId: m.ticket_id, userId: m.user_id,
          userName: m.user_name, userEmail: m.user_email,
          message: m.message, isAdmin: m.is_admin, createdAt: m.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/support — create ticket (any authenticated user)
router.post('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const parsed = ticketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const d = parsed.data;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "support_tickets" (subject, description, priority, category, user_id)
       VALUES ($1,$2,$3::ticket_priority,$4::ticket_category,$5) RETURNING *`,
      d.subject, d.description, d.priority, d.category, req.user?.id ?? null
    );
    res.status(201).json({ success: true, data: mapTicket(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// POST /api/support/:id/messages — reply to ticket
router.post('/:id/messages', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) { res.status(400).json({ success: false, error: 'Mensagem vazia' }); return; }

    const isAdmin = ['admin', 'super_admin', 'moderator', 'editor'].includes(req.user?.role || '');

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "support_messages" (ticket_id, user_id, message, is_admin)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      req.params.id, req.user?.id ?? null, message, isAdmin
    );

    // Update ticket status to pending when user replies
    if (!isAdmin) {
      await prisma.$executeRawUnsafe(
        `UPDATE "support_tickets" SET status='pending', updated_at=NOW() WHERE id=$1 AND status='open'`,
        req.params.id
      );
    }

    res.status(201).json({
      success: true,
      data: {
        id: rows[0].id, ticketId: rows[0].ticket_id,
        userId: rows[0].user_id, message: rows[0].message,
        isAdmin: rows[0].is_admin, createdAt: rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/support/:id/status — admin only status change
router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const extra = status === 'resolved'
      ? ', resolved_at = NOW()'
      : status === 'closed' ? ', closed_at = NOW()' : '';

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "support_tickets" SET status=$2::ticket_status${extra}, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      req.params.id, status
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'Ticket não encontrado' }); return; }
    res.json({ success: true, data: mapTicket(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/support/:id/assign — assign to admin user
router.patch('/:id/assign', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "support_tickets" SET assigned_to=$2, updated_at=NOW() WHERE id=$1 RETURNING *`,
      req.params.id, req.body.userId || null
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'Ticket não encontrado' }); return; }
    res.json({ success: true, data: mapTicket(rows[0]) });
  } catch (error) {
    next(error);
  }
});

export default router;
