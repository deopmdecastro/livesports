import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { parsePagination, buildPaginationMeta } from '../lib/pagination';

const router = Router();

const channelSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  banner: z.string().url().optional().or(z.literal('')),
  sport: z.string().optional(),
  country: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  social_links: z.record(z.string()).optional(),
});

const applicationSchema = z.object({
  channel_name: z.string().trim().min(2).max(200),
  description: z.string().trim().min(10).optional(),
  sport: z.string().optional(),
  social_links: z.record(z.string()).optional(),
});

function mapChannel(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    avatar: row.avatar,
    banner: row.banner,
    sport: row.sport,
    country: row.country,
    status: row.status,
    verified: row.verified,
    subscriberCount: Number(row.subscriber_count || 0),
    totalViews: Number(row.total_views || 0),
    liveCount: Number(row.live_count || 0),
    websiteUrl: row.website_url,
    socialLinks: row.social_links || {},
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── GET /api/creator/me — get my channel
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT c.*, u.name as owner_name, u.email as owner_email
       FROM channels c LEFT JOIN users u ON u.id = c.user_id
       WHERE c.user_id = $1 LIMIT 1`,
      req.user!.id
    );
    if (!rows[0]) {
      res.json({ success: true, data: null });
      return;
    }
    res.json({ success: true, data: mapChannel(rows[0]) });
  } catch (error) { next(error); }
});

// ── POST /api/creator/channel — create channel
router.post('/channel', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const parsed = channelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const d = parsed.data;

    // Check if user already has a channel
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM channels WHERE user_id = $1 LIMIT 1`, req.user!.id
    );
    if (existing[0]) {
      res.status(409).json({ success: false, error: 'Já tens um canal criado.' });
      return;
    }

    // Check slug uniqueness
    const slugCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM channels WHERE slug = $1 LIMIT 1`, d.slug
    );
    if (slugCheck[0]) {
      res.status(409).json({ success: false, error: 'Este slug já está em uso.' });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO channels (user_id, name, slug, description, avatar, banner, sport, country, website_url, social_links, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,'pending') RETURNING *`,
      req.user!.id, d.name, d.slug, d.description || null, d.avatar || null, d.banner || null,
      d.sport || null, d.country || null, d.website_url || null,
      JSON.stringify(d.social_links || {})
    );
    res.status(201).json({ success: true, data: mapChannel(rows[0]) });
  } catch (error) { next(error); }
});

// ── PATCH /api/creator/channel — update my channel
router.patch('/channel', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const parsed = channelSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const d = parsed.data;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE channels SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        avatar = COALESCE($4, avatar),
        banner = COALESCE($5, banner),
        sport = COALESCE($6, sport),
        country = COALESCE($7, country),
        website_url = COALESCE($8, website_url),
        social_links = COALESCE($9::jsonb, social_links),
        updated_at = NOW()
       WHERE user_id = $1 RETURNING *`,
      req.user!.id, d.name || null, d.description || null, d.avatar || null, d.banner || null,
      d.sport || null, d.country || null, d.website_url || null,
      d.social_links ? JSON.stringify(d.social_links) : null
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'Canal não encontrado.' }); return; }
    res.json({ success: true, data: mapChannel(rows[0]) });
  } catch (error) { next(error); }
});

// ── GET /api/creator/stats — creator analytics
router.get('/stats', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const [liveStats, channelRow] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint as total_lives,
          COUNT(*) FILTER (WHERE status = 'live')::bigint as live_now,
          COALESCE(SUM(total_views), 0)::bigint as total_views,
          COALESCE(SUM(viewer_count), 0)::bigint as current_viewers,
          COALESCE(SUM(like_count), 0)::bigint as total_likes
        FROM lives WHERE created_at > NOW() - INTERVAL '30 days'
      `),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT subscriber_count, total_views, live_count FROM channels WHERE user_id = $1 LIMIT 1`,
        req.user!.id
      ),
    ]);
    const ls = liveStats[0] || {};
    const ch = channelRow[0] || {};
    res.json({
      success: true,
      data: {
        totalLives: Number(ls.total_lives || 0),
        liveNow: Number(ls.live_now || 0),
        totalViews: Number(ls.total_views || 0),
        currentViewers: Number(ls.current_viewers || 0),
        totalLikes: Number(ls.total_likes || 0),
        subscribers: Number(ch.subscriber_count || 0),
        channelViews: Number(ch.total_views || 0),
        channelLiveCount: Number(ch.live_count || 0),
      },
    });
  } catch (error) { next(error); }
});

// ── POST /api/creator/apply — apply to become creator
router.post('/apply', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const d = parsed.data;
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, status FROM creator_applications WHERE user_id = $1 AND status = 'pending' LIMIT 1`,
      req.user!.id
    );
    if (existing[0]) {
      res.status(409).json({ success: false, error: 'Já tens uma candidatura pendente.' });
      return;
    }
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO creator_applications (user_id, channel_name, description, sport, social_links)
       VALUES ($1,$2,$3,$4,$5::jsonb) RETURNING *`,
      req.user!.id, d.channel_name, d.description || null, d.sport || null,
      JSON.stringify(d.social_links || {})
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
});

// ── GET /api/creator/applications — admin: list applications
router.get('/applications', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const where = status ? `WHERE ca.status = $1::creator_app_status` : '';
    const values: unknown[] = status ? [status] : [];

    const [rows, count] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT ca.*, u.name as user_name, u.email as user_email
         FROM creator_applications ca LEFT JOIN users u ON u.id = ca.user_id
         ${where} ORDER BY ca.created_at DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        ...values, pagination.limit, pagination.offset
      ),
      prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint as total FROM creator_applications ca ${where}`, ...values
      ),
    ]);
    res.json({
      success: true,
      data: {
        items: rows,
        pagination: buildPaginationMeta(pagination, Number(count[0]?.total || 0)),
      },
    });
  } catch (error) { next(error); }
});

// ── PATCH /api/creator/applications/:id — admin: approve/reject
router.patch('/applications/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { status, admin_notes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: 'Status inválido.' });
      return;
    }
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE creator_applications SET status=$2::creator_app_status, admin_notes=$3, reviewed_by=$4, reviewed_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      req.params.id, status, admin_notes || null, req.user!.id
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'Candidatura não encontrada.' }); return; }
    
    // If approved, update user role to creator
    if (status === 'approved') {
      await prisma.$executeRawUnsafe(
        `UPDATE users SET role='creator' WHERE id=$1`,
        rows[0].user_id
      );
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
});

// ── GET /api/creator/channels — admin: list all channels
router.get('/channels', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const where = status ? `WHERE c.status = $1::channel_status` : '';
    const values: unknown[] = status ? [status] : [];

    const [rows, count] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT c.*, u.name as owner_name, u.email as owner_email
         FROM channels c LEFT JOIN users u ON u.id = c.user_id
         ${where} ORDER BY c.created_at DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        ...values, pagination.limit, pagination.offset
      ),
      prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint as total FROM channels c ${where}`, ...values
      ),
    ]);
    res.json({
      success: true,
      data: {
        items: rows.map(mapChannel),
        pagination: buildPaginationMeta(pagination, Number(count[0]?.total || 0)),
      },
    });
  } catch (error) { next(error); }
});

// ── PATCH /api/creator/channels/:id/status — admin: activate/suspend channel
router.patch('/channels/:id/status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE channels SET status=$2::channel_status, updated_at=NOW() WHERE id=$1 RETURNING *`,
      req.params.id, status
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'Canal não encontrado.' }); return; }
    res.json({ success: true, data: mapChannel(rows[0]) });
  } catch (error) { next(error); }
});

export default router;
