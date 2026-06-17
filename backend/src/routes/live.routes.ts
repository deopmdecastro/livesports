import { Router } from 'express';
import { authenticateToken, requireAdmin, requireEditor, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

function mapLive(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    banner: row.banner,
    sport: row.sport,
    league: row.league,
    leagueLogo: row.league_logo,
    teamA: row.team_a,
    teamALogo: row.team_a_logo,
    teamB: row.team_b,
    teamBLogo: row.team_b_logo,
    scoreA: row.score_a,
    scoreB: row.score_b,
    streamUrl: row.stream_url,
    hlsUrl: row.hls_url,
    m3u8Url: row.m3u8_url,
    streamServers: row.stream_servers || [],
    status: row.status,
    featured: row.featured,
    viewerCount: row.viewer_count,
    totalViews: row.total_views,
    likeCount: row.like_count || 0,
    shareCount: row.share_count || 0,
    commentCount: row.comment_count ? Number(row.comment_count) : 0,
    matchTime: row.match_time,
    tags: row.tags || [],
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectLiveSql = `
  SELECT id, title, description, thumbnail, banner, sport::text, league, league_logo, team_a, team_a_logo,
    team_b, team_b_logo, score_a, score_b, stream_url, hls_url, m3u8_url, stream_servers,
    status::text, featured, viewer_count, total_views, like_count, share_count,
    (SELECT COUNT(*)::bigint FROM "live_comments" WHERE "live_id" = "lives"."id") AS comment_count,
    match_time, tags, scheduled_at, started_at, ended_at, created_at, updated_at
  FROM "lives"
`;

function mapComment(row: any) {
  return {
    id: row.id,
    liveId: row.live_id,
    clientId: row.client_id,
    userName: row.user_name,
    message: row.message,
    admin: row.admin,
    createdAt: row.created_at,
  };
}

async function getEventSnapshot(eventId: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT id, title, description, thumbnail, sport::text, league, league_logo,
             team_a, team_a_logo, team_b, team_b_logo, score_a, score_b, match_time
      FROM "events"
      WHERE id = $1
      LIMIT 1
    `,
    eventId
  );

  if (!rows[0]) return null;

  const row = rows[0];
  return {
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    sport: row.sport,
    league: row.league,
    leagueLogo: row.league_logo,
    teamA: row.team_a,
    teamALogo: row.team_a_logo,
    teamB: row.team_b,
    teamBLogo: row.team_b_logo,
    scoreA: row.score_a,
    scoreB: row.score_b,
    matchTime: row.match_time,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { status, sport, page = 1, limit = 20 } = req.query;
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}::live_status`);
    }
    if (sport) {
      values.push(sport);
      conditions.push(`sport = $${values.length}::sport_category`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectLiveSql} ${where} ORDER BY featured DESC, scheduled_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      ...values,
      limitNumber,
      offset
    );
    const countRows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*)::bigint AS total FROM "lives" ${where}`,
      ...values
    );
    const total = Number(countRows[0]?.total || 0);
    res.json({
      success: true,
      data: {
        items: rows.map(mapLive),
        pagination: { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/live', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectLiveSql} WHERE status = 'live' ORDER BY featured DESC, viewer_count DESC`);
    res.json({ success: true, data: rows.map(mapLive) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectLiveSql} WHERE id = $1 LIMIT 1`, req.params.id);
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Live nao encontrada' });
      return;
    }
    res.json({ success: true, data: mapLive(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/engagement', async (req, res, next) => {
  try {
    const clientId = String(req.query.clientId || '');
    const rows = await prisma.$queryRawUnsafe<Array<{
      total_views: number;
      viewer_count: number;
      like_count: number;
      share_count: number;
      comment_count: bigint;
      liked: boolean;
    }>>(
      `
        SELECT
          l.total_views,
          l.viewer_count,
          l.like_count,
          l.share_count,
          (SELECT COUNT(*)::bigint FROM "live_comments" c WHERE c.live_id = l.id) AS comment_count,
          EXISTS(SELECT 1 FROM "live_reactions" r WHERE r.live_id = l.id AND r.client_id = $2) AS liked
        FROM "lives" l
        WHERE l.id = $1
        LIMIT 1
      `,
      req.params.id,
      clientId
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Live nao encontrada' });
      return;
    }
    res.json({
      success: true,
      data: {
        totalViews: rows[0].total_views,
        viewerCount: rows[0].viewer_count,
        likeCount: rows[0].like_count,
        shareCount: rows[0].share_count,
        commentCount: Number(rows[0].comment_count),
        liked: rows[0].liked,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/view', async (req, res, next) => {
  try {
    const clientId = req.body?.clientId || null;
    const ip = req.ip || req.headers['x-forwarded-for'] || null;
    const userAgent = req.headers['user-agent'] || null;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "live_views" ("live_id", "client_id", "ip", "user_agent")
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      req.params.id,
      clientId,
      Array.isArray(ip) ? ip[0] : ip,
      userAgent
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Live nao encontrada' });
      return;
    }
    const updated = await prisma.$queryRawUnsafe<Array<{ total_views: number; viewer_count: number }>>(
      `UPDATE "lives" SET total_views = total_views + 1, viewer_count = viewer_count + 1, updated_at = NOW() WHERE id = $1 RETURNING total_views, viewer_count`,
      req.params.id
    );
    res.json({ success: true, data: { totalViews: updated[0].total_views, viewerCount: updated[0].viewer_count } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        SELECT id, live_id, client_id, user_name, message, admin, created_at
        FROM "live_comments"
        WHERE live_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      req.params.id,
      limit
    );
    res.json({ success: true, data: rows.reverse().map(mapComment) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      res.status(400).json({ success: false, error: 'Comentario vazio' });
      return;
    }
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "live_comments" ("live_id", "client_id", "user_name", "message", "admin")
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING id, live_id, client_id, user_name, message, admin, created_at
      `,
      req.params.id,
      req.body?.clientId || null,
      String(req.body?.userName || 'Visitante').slice(0, 120),
      message.slice(0, 500)
    );
    res.status(201).json({ success: true, data: mapComment(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/like', async (req, res, next) => {
  try {
    const clientId = String(req.body?.clientId || '').trim();
    if (!clientId) {
      res.status(400).json({ success: false, error: 'clientId obrigatorio' });
      return;
    }

    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "live_reactions" WHERE live_id = $1 AND client_id = $2 LIMIT 1`,
      req.params.id,
      clientId
    );

    if (existing[0]) {
      await prisma.$executeRawUnsafe(`DELETE FROM "live_reactions" WHERE id = $1`, existing[0].id);
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "live_reactions" ("live_id", "client_id") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        req.params.id,
        clientId
      );
    }

    const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint AS count FROM "live_reactions" WHERE live_id = $1`,
      req.params.id
    );
    const likeCount = Number(countRows[0]?.count || 0);
    await prisma.$executeRawUnsafe(`UPDATE "lives" SET like_count = $2, updated_at = NOW() WHERE id = $1`, req.params.id, likeCount);
    res.json({ success: true, data: { liked: !existing[0], likeCount } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/share', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ share_count: number }>>(
      `
        WITH inserted AS (
          INSERT INTO "live_shares" ("live_id", "client_id", "target")
          VALUES ($1, $2, $3)
          RETURNING id
        )
        UPDATE "lives" SET share_count = share_count + 1, updated_at = NOW()
        WHERE id = $1
        RETURNING share_count
      `,
      req.params.id,
      req.body?.clientId || null,
      req.body?.target || 'copy'
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Live nao encontrada' });
      return;
    }
    res.json({ success: true, data: { shareCount: rows[0].share_count } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;
    const servers = body.streamServers || [];
    const streamUrl = body.hlsUrl || body.m3u8Url || body.streamUrl || servers[0]?.url || null;

    // Snapshot from event (optional)
    let snapshot: Awaited<ReturnType<typeof getEventSnapshot>> | null = null;
    if (body.eventId) {
      snapshot = await getEventSnapshot(String(body.eventId));
      if (!snapshot) {
        res.status(400).json({ success: false, error: 'eventId invalido' });
        return;
      }
    }

    const title = snapshot?.title || body.title;
    const sport = (snapshot?.sport || body.sport || 'football') as string;

    if (!title) {
      res.status(400).json({ success: false, error: 'Informe o titulo da live.' });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "lives" (
          title, description, thumbnail, banner, sport, league, league_logo, stream_url, hls_url, m3u8_url,
          stream_servers, status, featured, scheduled_at,
          team_a, team_a_logo, team_b, team_b_logo, score_a, score_b, match_time
        )
        VALUES (
          $1, $2, $3, $4,
          $5::sport_category, $6, $7,
          $8, $9, $10,
          $11::jsonb, $12::live_status, $13, $14::timestamptz,
          $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `,
      title,
      snapshot?.description ?? body.description ?? null,
      snapshot?.thumbnail ?? body.thumbnail ?? null,
      snapshot?.thumbnail ?? body.banner ?? body.thumbnail ?? null,
      sport,
      snapshot?.league ?? body.league ?? null,
      snapshot?.leagueLogo ?? body.leagueLogo ?? null,
      streamUrl,
      body.hlsUrl || streamUrl,
      body.m3u8Url || null,
      JSON.stringify(servers),
      body.status || 'scheduled',
      Boolean(body.featured),
      body.scheduledAt || new Date().toISOString(),
      snapshot?.teamA ?? body.teamA ?? null,
      snapshot?.teamALogo ?? body.teamALogo ?? null,
      snapshot?.teamB ?? body.teamB ?? null,
      snapshot?.teamBLogo ?? body.teamBLogo ?? null,
      snapshot?.scoreA ?? body.scoreA ?? null,
      snapshot?.scoreB ?? body.scoreB ?? null,
      snapshot?.matchTime ?? body.matchTime ?? null
    );

    res.status(201).json({ success: true, data: mapLive(rows[0]), message: 'Live criada com sucesso!' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;
    const servers = body.streamServers || [];
    const streamUrl = body.hlsUrl || body.m3u8Url || body.streamUrl || servers[0]?.url || null;

    // Snapshot from event (optional)
    let snapshot: Awaited<ReturnType<typeof getEventSnapshot>> | null = null;
    if (body.eventId) {
      snapshot = await getEventSnapshot(String(body.eventId));
      if (!snapshot) {
        res.status(400).json({ success: false, error: 'eventId invalido' });
        return;
      }
    }

    const title = snapshot?.title || body.title;
    const sport = (snapshot?.sport || body.sport || 'football') as string;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "lives"
        SET title = $2, description = $3, thumbnail = $4, banner = $5, sport = $6::sport_category,
            league = $7, league_logo = $8, stream_url = $9, hls_url = $10, m3u8_url = $11,
            stream_servers = $12::jsonb, status = $13::live_status, featured = $14,
            scheduled_at = $15::timestamptz, updated_at = NOW(),
            team_a = $16, team_a_logo = $17, team_b = $18, team_b_logo = $19,
            score_a = $20, score_b = $21, match_time = $22
        WHERE id = $1
        RETURNING *
      `,
      req.params.id,
      title,
      snapshot?.description ?? body.description ?? null,
      snapshot?.thumbnail ?? body.thumbnail ?? null,
      snapshot?.thumbnail ?? body.banner ?? body.thumbnail ?? null,
      sport,
      snapshot?.league ?? body.league ?? null,
      snapshot?.leagueLogo ?? body.leagueLogo ?? null,
      streamUrl,
      body.hlsUrl || streamUrl,
      body.m3u8Url || null,
      JSON.stringify(servers),
      body.status || 'scheduled',
      Boolean(body.featured),
      body.scheduledAt || new Date().toISOString(),
      snapshot?.teamA ?? body.teamA ?? null,
      snapshot?.teamALogo ?? body.teamALogo ?? null,
      snapshot?.teamB ?? body.teamB ?? null,
      snapshot?.teamBLogo ?? body.teamBLogo ?? null,
      snapshot?.scoreA ?? body.scoreA ?? null,
      snapshot?.scoreB ?? body.scoreB ?? null,
      snapshot?.matchTime ?? body.matchTime ?? null
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Live nao encontrada' });
      return;
    }
    res.json({ success: true, data: mapLive(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "lives" SET status = $2::live_status, updated_at = NOW() WHERE id = $1 RETURNING *`,
      req.params.id,
      req.body.status
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Live nao encontrada' });
      return;
    }
    res.json({ success: true, data: mapLive(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`DELETE FROM "lives" WHERE id = $1 RETURNING id`, req.params.id);
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Live nao encontrada' });
      return;
    }
    res.json({ success: true, message: 'Live removida com sucesso!' });
  } catch (error) {
    next(error);
  }
});

export default router;

