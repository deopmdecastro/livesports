import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// All routes require admin
router.use(authenticateToken, requireAdmin);

const apiKeySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().nullish(),
  provider: z.string().trim().min(1).max(200),
  baseUrl: z.string().trim().nullish(),
  keyValue: z.string().trim().min(1),
  status: z.enum(['active', 'inactive', 'expired']).default('active'),
  priority: z.coerce.number().int().min(1).default(1),
  requestLimit: z.coerce.number().int().nullish(),
  expiresAt: z.string().trim().nullish(),
  usageTypes: z.array(z.enum([
    'live_streams', 'game_events', 'game_data', 'statistics',
    'competitions', 'teams', 'players', 'shields', 'logos',
    'flags', 'standings', 'odds', 'news',
  ])).default([]),
});

function mapKey(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    provider: row.provider,
    baseUrl: row.base_url,
    keyValue: row.key_value ? `${row.key_value.slice(0, 6)}${'*'.repeat(Math.max(0, row.key_value.length - 10))}${row.key_value.slice(-4)}` : null,
    status: row.status,
    priority: row.priority,
    requestLimit: row.request_limit,
    requestsUsed: row.requests_used,
    errorCount: row.error_count,
    lastUsedAt: row.last_used_at,
    lastSyncedAt: row.last_synced_at,
    expiresAt: row.expires_at,
    usageTypes: row.usage_types || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/api-keys — list all
router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "api_keys" ORDER BY priority DESC, created_at DESC`
    );
    res.json({ success: true, data: rows.map(mapKey) });
  } catch (error) {
    next(error);
  }
});

// GET /api/api-keys/discovery — show real API usage stats
router.get('/discovery', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "api_keys" ORDER BY priority DESC, created_at DESC`
    );

    // Augment with live stats from env vars to show which APIs are configured
    const envApis = [
      {
        key: 'API_FOOTBALL_KEY',
        name: 'API-Football',
        provider: 'api-sports.io',
        baseUrl: 'https://v3.football.api-sports.io',
        usageTypes: ['game_events', 'game_data', 'statistics', 'live_streams'],
        configured: !!process.env.API_FOOTBALL_KEY,
      },
      {
        key: 'FOOTBALL_DATA_API_TOKEN',
        name: 'Football-Data.org',
        provider: 'football-data.org',
        baseUrl: 'https://api.football-data.org/v4',
        usageTypes: ['competitions', 'game_events', 'teams'],
        configured: !!process.env.FOOTBALL_DATA_API_TOKEN,
      },
      {
        key: 'RAPIDAPI_KEY',
        name: 'RapidAPI Live Streams',
        provider: 'rapidapi.com',
        baseUrl: 'https://rapidapi.com',
        usageTypes: ['live_streams'],
        configured: !!process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your-rapidapi-key',
      },
      {
        key: 'THESPORTSDB_API_KEY',
        name: 'TheSportsDB',
        provider: 'thesportsdb.com',
        baseUrl: 'https://www.thesportsdb.com/api',
        usageTypes: ['teams', 'competitions', 'game_events', 'logos', 'shields'],
        configured: true, // free tier always available
      },
    ];

    // Get event/live counts per source
    const eventCounts = await prisma.$queryRawUnsafe<Array<{ source: string; count: bigint }>>(
      `SELECT COALESCE(import_source, 'manual') as source, COUNT(*)::bigint as count FROM "events" GROUP BY import_source`
    ).catch(() => []);

    const liveCounts = await prisma.$queryRawUnsafe<Array<{ source: string; count: bigint }>>(
      `SELECT COALESCE(import_source, 'manual') as source, COUNT(*)::bigint as count FROM "lives" GROUP BY import_source`
    ).catch(() => []);

    const eventMap: Record<string, number> = {};
    (eventCounts as any[]).forEach((r) => { eventMap[r.source] = Number(r.count); });

    const liveMap: Record<string, number> = {};
    (liveCounts as any[]).forEach((r) => { liveMap[r.source] = Number(r.count); });

    res.json({
      success: true,
      data: {
        envApis,
        dbKeys: rows.map(mapKey),
        importStats: {
          events: eventMap,
          lives: liveMap,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/api-keys — create
router.post('/', async (req, res, next) => {
  try {
    const parsed = apiKeySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const d = parsed.data;
    const usageTypesLiteral = `'{${d.usageTypes.map((t) => `"${t}"`).join(',')}}'::api_usage_type[]`;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "api_keys" (name, description, provider, base_url, key_value, status, priority, request_limit, expires_at, usage_types)
       VALUES ($1,$2,$3,$4,$5,$6::api_key_status,$7,$8,$9::timestamptz,${usageTypesLiteral})
       RETURNING *`,
      d.name, d.description ?? null, d.provider, d.baseUrl ?? null, d.keyValue,
      d.status, d.priority, d.requestLimit ?? null, d.expiresAt ?? null,
    );
    res.status(201).json({ success: true, data: mapKey(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/api-keys/:id — update
router.put('/:id', async (req, res, next) => {
  try {
    const parsed = apiKeySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const d = parsed.data;
    const usageTypesLiteral = `'{${d.usageTypes.map((t) => `"${t}"`).join(',')}}'::api_usage_type[]`;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "api_keys" SET name=$2,description=$3,provider=$4,base_url=$5,key_value=$6,
       status=$7::api_key_status,priority=$8,request_limit=$9,expires_at=$10::timestamptz,
       usage_types=${usageTypesLiteral},updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      req.params.id, d.name, d.description ?? null, d.provider, d.baseUrl ?? null, d.keyValue,
      d.status, d.priority, d.requestLimit ?? null, d.expiresAt ?? null,
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'API Key não encontrada' }); return; }
    res.json({ success: true, data: mapKey(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/api-keys/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "api_keys" SET status=$2::api_key_status, updated_at=NOW() WHERE id=$1 RETURNING *`,
      req.params.id, req.body.status
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'API Key não encontrada' }); return; }
    res.json({ success: true, data: mapKey(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/api-keys/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `DELETE FROM "api_keys" WHERE id=$1 RETURNING id`, req.params.id
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'API Key não encontrada' }); return; }
    res.json({ success: true, message: 'API Key removida.' });
  } catch (error) {
    next(error);
  }
});

export default router;
