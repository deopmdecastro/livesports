import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { parsePagination, buildPaginationMeta } from '../lib/pagination';

const router = Router();

router.use(authenticateToken, requireAdmin);

export async function writeLog(opts: {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: 'api' | 'player' | 'sync' | 'auth' | 'admin' | 'database' | 'stream' | 'system';
  message: string;
  details?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "system_logs" (level, service, message, details, user_id, request_id, ip, user_agent)
       VALUES ($1::log_level, $2::log_service, $3, $4::jsonb, $5, $6, $7, $8)`,
      opts.level, opts.service, opts.message,
      opts.details ? JSON.stringify(opts.details) : null,
      opts.userId ?? null, opts.requestId ?? null,
      opts.ip ?? null, opts.userAgent ?? null,
    );
  } catch {
    // Never let logging failures crash the app
  }
}

// GET /api/logs — list with filters
router.get('/', async (req, res, next) => {
  try {
    const { level, service, from, to, q } = req.query;
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (level) {
      values.push(level);
      conditions.push(`level = $${values.length}::log_level`);
    }
    if (service) {
      values.push(service);
      conditions.push(`service = $${values.length}::log_service`);
    }
    if (from) {
      values.push(from);
      conditions.push(`created_at >= $${values.length}::timestamptz`);
    }
    if (to) {
      values.push(to);
      conditions.push(`created_at <= $${values.length}::timestamptz`);
    }
    if (q) {
      values.push(`%${String(q)}%`);
      conditions.push(`message ILIKE $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pagination = parsePagination(req.query as Record<string, unknown>, { limit: 100 });

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT l.*, u.name as user_name, u.email as user_email
         FROM "system_logs" l
         LEFT JOIN "users" u ON u.id = l.user_id
         ${where}
         ORDER BY l.created_at DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        ...values, pagination.limit, pagination.offset
      ),
      prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint AS total FROM "system_logs" ${where}`,
        ...values
      ),
    ]);

    const total = Number(countRows[0]?.total || 0);
    res.json({
      success: true,
      data: {
        items: rows.map((r) => ({
          id: r.id,
          level: r.level,
          service: r.service,
          message: r.message,
          details: r.details,
          userId: r.user_id,
          userName: r.user_name,
          userEmail: r.user_email,
          requestId: r.request_id,
          ip: r.ip,
          userAgent: r.user_agent,
          createdAt: r.created_at,
        })),
        pagination: buildPaginationMeta(pagination, total),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/logs/stats — summary stats
router.get('/stats', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*)::bigint as total,
        COUNT(*) FILTER (WHERE level = 'error')::bigint as errors,
        COUNT(*) FILTER (WHERE level = 'warn')::bigint as warnings,
        COUNT(*) FILTER (WHERE level = 'fatal')::bigint as fatals,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour')::bigint as last_hour,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint as last_24h
      FROM "system_logs"
    `);

    const byService = await prisma.$queryRawUnsafe<any[]>(`
      SELECT service, COUNT(*)::bigint as count
      FROM "system_logs"
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY service ORDER BY count DESC
    `);

    const r = rows[0] || {};
    res.json({
      success: true,
      data: {
        total: Number(r.total || 0),
        errors: Number(r.errors || 0),
        warnings: Number(r.warnings || 0),
        fatals: Number(r.fatals || 0),
        lastHour: Number(r.last_hour || 0),
        last24h: Number(r.last_24h || 0),
        byService: byService.map((s) => ({ service: s.service, count: Number(s.count) })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/logs — purge old logs
router.delete('/', async (req, res, next) => {
  try {
    const days = Number(req.query.days || 30);
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `WITH deleted AS (
        DELETE FROM "system_logs" WHERE created_at < NOW() - $1::interval RETURNING id
       ) SELECT COUNT(*)::bigint FROM deleted`,
      `${days} days`
    );
    res.json({ success: true, data: { deleted: Number(result[0]?.count || 0) } });
  } catch (error) {
    next(error);
  }
});

export default router;
