import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// All routes require admin
router.use(authenticateToken, requireAdmin);

// ── Env-backed API keys (API-Football, Football-Data.org, RapidAPI, TheSportsDB) ──
// These providers are configured via process.env rather than the DB-backed
// api_keys table. Editing them here updates the running process immediately
// and persists the change to the backend .env file so it survives restarts.
const ENV_KEY_META: Record<string, { name: string; envFile: string }> = {
  API_FOOTBALL_KEY: { name: 'API-Football', envFile: 'API_FOOTBALL_KEY' },
  FOOTBALL_DATA_API_TOKEN: { name: 'Football-Data.org', envFile: 'FOOTBALL_DATA_API_TOKEN' },
  RAPIDAPI_KEY: { name: 'RapidAPI Live Streams', envFile: 'RAPIDAPI_KEY' },
  THESPORTSDB_API_KEY: { name: 'TheSportsDB', envFile: 'THESPORTSDB_API_KEY' },
  NEWSDATA_API_KEY: { name: 'NewsData.io', envFile: 'NEWSDATA_API_KEY' },
  NEWSAPI_KEY: { name: 'NewsAPI.org', envFile: 'NEWSAPI_KEY' },
};

function persistEnvValue(key: string, value: string) {
  const envPath = path.resolve(__dirname, '../../.env');
  let contents = '';
  try {
    contents = fs.readFileSync(envPath, 'utf8');
  } catch {
    contents = '';
  }
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(contents)) {
    contents = contents.replace(pattern, line);
  } else {
    contents = contents.length && !contents.endsWith('\n') ? `${contents}\n${line}\n` : `${contents}${line}\n`;
  }
  fs.writeFileSync(envPath, contents, 'utf8');
}

// PUT /api/api-keys/env/:envKey — update an environment-backed API key
router.put('/env/:envKey', async (req, res, next) => {
  try {
    const { envKey } = req.params;
    const meta = ENV_KEY_META[envKey];
    if (!meta) {
      res.status(400).json({ success: false, error: 'Chave de ambiente desconhecida' });
      return;
    }
    const schema = z.object({ keyValue: z.string().trim().min(1, 'A chave não pode estar vazia') });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const { keyValue } = parsed.data;
    process.env[envKey] = keyValue;
    try {
      persistEnvValue(meta.envFile, keyValue);
    } catch (writeErr) {
      // Non-fatal: the running process still has the new value in memory
      console.error('Falha ao persistir .env:', writeErr);
    }
    res.json({ success: true, data: { key: envKey, name: meta.name, configured: true } });
  } catch (error) {
    next(error);
  }
});



// ── Bridges the two "API Keys" UIs together ────────────────────────────────
// The frontend has two tabs that look related but write to different places:
//   - "Chaves" (this router's DB-backed CRUD below) — a generic record store.
//   - "Descoberta" (PUT /env/:envKey above) — writes straight to process.env
//     and the .env file, which is what the actual integrations
//     (newsapi.ts, newsdata.ts, thesportsdb.ts, competition-sync.ts,
//     rapidapi-live-stream.ts) read from at request time.
// A key saved only in the DB table was therefore never "live" — it recorded
// fine but nothing consumed it. When a DB-backed key's `provider` matches one
// of the built-in integrations below, mirror the value into the env var too,
// so saving in either tab actually powers the same running integration.
const PROVIDER_TO_ENV_KEY: Record<string, string> = {
  api_football: 'API_FOOTBALL_KEY',
  football_data: 'FOOTBALL_DATA_API_TOKEN',
  thesportsdb: 'THESPORTSDB_API_KEY',
  newsdata: 'NEWSDATA_API_KEY',
  newsapi: 'NEWSAPI_KEY',
};

function syncToEnvIfKnownProvider(provider: string, keyValue: string | null | undefined) {
  const envKey = PROVIDER_TO_ENV_KEY[provider];
  if (!envKey || !keyValue) return;
  process.env[envKey] = keyValue;
  try {
    persistEnvValue(envKey, keyValue);
  } catch (writeErr) {
    console.error('Falha ao persistir .env a partir de API Keys:', writeErr);
  }
}

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
      {
        key: 'NEWSDATA_API_KEY',
        name: 'NewsData.io',
        provider: 'newsdata.io',
        baseUrl: 'https://newsdata.io/api/1',
        usageTypes: ['news'],
        configured: !!process.env.NEWSDATA_API_KEY && process.env.NEWSDATA_API_KEY !== 'your-newsdata-api-key',
      },
      {
        key: 'NEWSAPI_KEY',
        name: 'NewsAPI.org',
        provider: 'newsapi.org',
        baseUrl: 'https://newsapi.org/v2',
        usageTypes: ['news'],
        configured: !!process.env.NEWSAPI_KEY && process.env.NEWSAPI_KEY !== 'your-newsapi-key',
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
    const usageTypesLiteral = d.usageTypes.length > 0 ? `ARRAY[${d.usageTypes.map((t) => `'${t}'`).join(',')}]::"api_usage_type"[]` : "'{}'::\"api_usage_type\"[]";
    // `status` is embedded as a literal (not a bound $N param) on purpose:
    // it's already restricted to a closed Zod enum above, so this is safe,
    // and it sidesteps a Prisma quirk where $queryRawUnsafe binds JS strings
    // with an explicit `text` OID — Postgres then refuses the `::api_key_status`
    // cast on that bound parameter ("column is of type api_key_status but
    // expression is of type text"), even though the exact same cast works
    // fine on an inline literal.
    const statusLiteral = `'${d.status}'::api_key_status`;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "api_keys" (name, description, provider, base_url, key_value, status, priority, request_limit, expires_at, usage_types)
       VALUES ($1,$2,$3,$4,$5,${statusLiteral},$6,$7,$8::timestamptz,${usageTypesLiteral})
       RETURNING *`,
      d.name, d.description ?? null, d.provider, d.baseUrl ?? null, d.keyValue,
      d.priority, d.requestLimit ?? null, d.expiresAt ?? null,
    );
    syncToEnvIfKnownProvider(d.provider, d.keyValue);
    res.status(201).json({ success: true, data: mapKey(rows[0]) });
  } catch (error: any) {
    console.error('[api-keys POST] Failed to create API key:', error?.message || error);
    if (error?.message?.includes('relation "api_keys" does not exist')) {
      res.status(500).json({ success: false, error: 'Tabela api_keys não existe — execute as migrações ou reinicie o servidor.' });
      return;
    }
    if (error?.message?.includes('type "api_key_status" does not exist') || error?.message?.includes('type "api_usage_type" does not exist')) {
      res.status(500).json({ success: false, error: 'Tipos api_key_status/api_usage_type não encontrados — reinicie o servidor para recriar os tipos.' });
      return;
    }
    if (error?.message?.includes('column "usage_types" is of type')) {
      res.status(500).json({ success: false, error: 'Coluna usage_types com tipo desatualizado — reinicie o servidor para migrar automaticamente o schema.' });
      return;
    }
    next(error);
  }
});

// PUT /api/api-keys/:id — update
router.put('/:id', async (req, res, next) => {
  try {
    // For edits, keyValue is optional - keep existing if not provided
    const editSchema = apiKeySchema.extend({
      keyValue: z.string().trim().optional(),
    }).partial({ keyValue: true });
    const parsed = editSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const d = parsed.data;
    if (!d.name || !d.provider) {
      res.status(400).json({ success: false, error: 'Nome e provedor sao obrigatorios' });
      return;
    }
    const usageTypesLiteral = (d.usageTypes || []).length > 0 ? `ARRAY[${(d.usageTypes || []).map((t) => `'${t}'`).join(',')}]::"api_usage_type"[]` : "'{}'::\"api_usage_type\"[]";

    // If keyValue not provided, keep existing
    let keyValueParam: string | null = d.keyValue || null;
    if (!keyValueParam) {
      // Fetch existing key value
      const existing = await prisma.$queryRawUnsafe<Array<{ key_value: string }>>(
        `SELECT key_value FROM "api_keys" WHERE id = $1`,
        req.params.id
      );
      keyValueParam = existing[0]?.key_value || null;
    }

    const statusLiteral = `'${d.status}'::api_key_status`;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "api_keys" SET name=$2,description=$3,provider=$4,base_url=$5,key_value=$6,
       status=${statusLiteral},priority=$7,request_limit=$8,expires_at=$9::timestamptz,
       usage_types=${usageTypesLiteral},updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      req.params.id, d.name, d.description ?? null, d.provider, d.baseUrl ?? null, keyValueParam,
      d.priority, d.requestLimit ?? null, d.expiresAt ?? null,
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'API Key não encontrada' }); return; }
    syncToEnvIfKnownProvider(d.provider, keyValueParam);
    res.json({ success: true, data: mapKey(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/api-keys/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const allowedStatuses = ['active', 'inactive', 'expired'];
    if (!allowedStatuses.includes(req.body.status)) {
      res.status(400).json({ success: false, error: `status deve ser um de: ${allowedStatuses.join(', ')}` });
      return;
    }
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "api_keys" SET status='${req.body.status}'::api_key_status, updated_at=NOW() WHERE id=$1 RETURNING *`,
      req.params.id
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

// POST /api/api-keys/:id/test — test API connectivity
router.post('/:id/test', async (req, res, next) => {
  const startAt = Date.now();
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, provider, base_url, key_value FROM "api_keys" WHERE id = $1`,
      req.params.id
    );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ success: false, error: 'API Key não encontrada' });
      return;
    }

    const baseUrl = row.base_url as string | null;
    const provider = (row.provider as string).toLowerCase();
    const isKnownProvider = provider.includes('api_football') || provider.includes('rapidapi')
      || provider.includes('football_data') || provider.includes('football-data')
      || provider.includes('thesportsdb') || provider.includes('newsapi') || provider.includes('newsdata');
    if (!baseUrl && !isKnownProvider) {
      res.json({ success: true, data: { reachable: false, latencyMs: null, statusCode: null, message: 'URL base não configurada — não é possível testar.' } });
      return;
    }

    // Build a simple test request based on provider
    const apiKey = row.key_value as string;
    const headers: Record<string, string> = {};
    const queryParams: Record<string, string> = {};

    if (provider.includes('api_football') || provider.includes('rapidapi')) {
      headers['x-rapidapi-key'] = apiKey;
      headers['x-apisports-key'] = apiKey;
    } else if (provider.includes('football_data') || provider.includes('football-data')) {
      headers['X-Auth-Token'] = apiKey;
    } else if (provider.includes('thesportsdb')) {
      // TheSportsDB uses key in URL path — just ping base
    } else if (provider.includes('newsapi')) {
      headers['X-Api-Key'] = apiKey;
    } else if (provider.includes('newsdata')) {
      queryParams['apikey'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const testUrl = provider.includes('api_football')
        ? 'https://v3.football.api-sports.io/status'
        : provider.includes('football_data')
          ? 'https://api.football-data.org/v4/competitions?limit=1'
          : provider.includes('thesportsdb')
            ? `https://www.thesportsdb.com/api/v1/json/${apiKey}/all_leagues.php`
            : provider.includes('newsapi')
              ? 'https://newsapi.org/v2/top-headlines?category=sports&country=us&pageSize=1'
              : provider.includes('newsdata')
                ? 'https://newsdata.io/api/1/latest?category=sports&language=en'
                : (baseUrl as string);

      const response = await axios.get(testUrl, {
        headers,
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        timeout: 8000,
        validateStatus: () => true,
      });

      const latencyMs = Date.now() - startAt;
      const statusCode = response.status;
      // Some providers (notably RapidAPI/api-sports) return HTTP 200 even
      // with an invalid key, surfacing the failure only in the JSON body.
      const body = response.data;
      const bodyHasErrors = !!(body && typeof body === 'object' && (
        (Array.isArray(body.errors) ? body.errors.length > 0 : body.errors && Object.keys(body.errors).length > 0) ||
        body.status === 'error'
      ));
      const isAuthError = statusCode === 401 || statusCode === 403;
      // Only a genuine 2xx (and no body-level error) counts as success.
      // Anything else — including 401/403 (invalid key), which a naive
      // "< 500" check used to wave through as if it had worked — is a
      // real failure and must be reported as one.
      const reachable = statusCode >= 200 && statusCode < 300 && !bodyHasErrors;

      // Update last_used_at and error_count
      if (reachable) {
        await prisma.$executeRawUnsafe(
          `UPDATE "api_keys" SET last_used_at=NOW(), error_count=0 WHERE id=$1`,
          req.params.id
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE "api_keys" SET error_count=error_count+1 WHERE id=$1`,
          req.params.id
        );
      }

      const message = reachable
        ? `Conectividade OK (${statusCode}) — ${latencyMs}ms`
        : isAuthError || bodyHasErrors
          ? `Chave inválida ou sem permissão (HTTP ${statusCode})`
          : statusCode === 429
            ? 'Limite de pedidos excedido (HTTP 429) — tente novamente mais tarde'
            : statusCode === 404
              ? 'Endpoint não encontrado (HTTP 404) — verifique o URL base'
              : `Erro de conectividade (HTTP ${statusCode})`;

      res.json({
        success: true,
        data: { reachable, latencyMs, statusCode, message },
      });
    } catch (fetchErr: any) {
      await prisma.$executeRawUnsafe(
        `UPDATE "api_keys" SET error_count=error_count+1 WHERE id=$1`,
        req.params.id
      );
      const latencyMs = Date.now() - startAt;
      res.json({
        success: true,
        data: {
          reachable: false,
          latencyMs,
          statusCode: null,
          message: fetchErr?.code === 'ECONNREFUSED'
            ? 'Ligação recusada — verifique o URL base'
            : fetchErr?.code === 'ETIMEDOUT' || fetchErr?.code === 'ECONNABORTED'
              ? 'Timeout — API não respondeu a tempo'
              : `Erro: ${fetchErr?.message || 'Desconhecido'}`,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
