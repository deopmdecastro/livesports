import { Router } from 'express';
import { authenticateToken, requireEditor } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { syncAllCompetitions } from '../lib/competition-sync';

const router = Router();

const COMPETITION_SELECT = `
  id, name, slug, season, sport::text, description, thumbnail, banner,
  start_date, end_date, status::text, format::text, archived, created_at, updated_at,
  hero_badge, hero_badge_icon, hero_title_line1, hero_title_line2, hero_description,
  stat_teams, stat_games, stat_host_countries, stat_stadiums,
  host_countries, section_title, cta_title, cta_description, cta_button_text,
  groups_data, theme_color, is_featured_card
`;

function parseGroupsData(value: unknown) {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function mapCompetition(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    sport: row.sport,
    description: row.description,
    thumbnail: row.thumbnail,
    banner: row.banner,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    format: row.format || 'groups',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    heroBadge: row.hero_badge,
    heroBadgeIcon: row.hero_badge_icon,
    heroTitleLine1: row.hero_title_line1,
    heroTitleLine2: row.hero_title_line2,
    heroDescription: row.hero_description,
    statTeams: row.stat_teams != null ? Number(row.stat_teams) : 0,
    statGames: row.stat_games != null ? Number(row.stat_games) : 0,
    statHostCountries: row.stat_host_countries != null ? Number(row.stat_host_countries) : 0,
    statStadiums: row.stat_stadiums != null ? Number(row.stat_stadiums) : 0,
    hostCountries: row.host_countries,
    sectionTitle: row.section_title,
    ctaTitle: row.cta_title,
    ctaDescription: row.cta_description,
    ctaButtonText: row.cta_button_text,
    groupsData: parseGroupsData(row.groups_data),
    themeColor: row.theme_color,
    isFeaturedCard: Boolean(row.is_featured_card),
  };
}

function mapPublicEvent(row: any) {
  const stage =
    row.stage ||
    (row.group_name ? `Grupo ${row.group_name}` : null);

  return {
    id: row.id,
    title: row.title,
    teamA: row.team_a,
    teamB: row.team_b,
    teamACode: row.team_a_code,
    teamBCode: row.team_b_code,
    teamALogo: row.team_a_logo,
    teamBLogo: row.team_b_logo,
    scoreA: row.score_a,
    scoreB: row.score_b,
    status: row.status,
    scheduledAt: row.scheduled_at,
    stage,
    groupName: row.group_name,
    venue: row.venue,
    matchTime: row.match_time,
  };
}

const EVENT_PUBLIC_SELECT = `
  SELECT
    id, title, team_a, team_b, team_a_code, team_b_code,
    team_a_logo, team_b_logo, score_a, score_b, status::text,
    scheduled_at, stage, group_name, venue, match_time
  FROM "events"
`;

const COMPETITION_PUBLIC_LIST_SELECT = `
  id, name, slug, season, format::text, sport::text,
  hero_badge, hero_badge_icon, host_countries, section_title, thumbnail, theme_color, is_featured_card
`;

function mapPublicCompetitionSummary(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    format: row.format || 'groups',
    sport: row.sport,
    heroBadge: row.hero_badge,
    heroBadgeIcon: row.hero_badge_icon || '⚽',
    hostCountries: row.host_countries,
    sectionTitle: row.section_title,
    thumbnail: row.thumbnail,
    themeColor: row.theme_color,
    isFeaturedCard: Boolean(row.is_featured_card),
  };
}

router.get('/public', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT ${COMPETITION_PUBLIC_LIST_SELECT}
      FROM "competitions"
      WHERE status = 'active'::competition_status AND COALESCE(archived, FALSE) = FALSE
      ORDER BY
        is_featured_card DESC,
        host_countries ASC NULLS LAST,
        name ASC
    `);

    res.json({ success: true, data: rows.map(mapPublicCompetitionSummary) });
  } catch (error) {
    next(error);
  }
});

router.get('/public/:slug', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        SELECT ${COMPETITION_SELECT}
        FROM "competitions"
        WHERE slug = $1 AND status = 'active'::competition_status AND COALESCE(archived, FALSE) = FALSE
        LIMIT 1
      `,
      req.params.slug
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Competicao nao encontrada' });
      return;
    }

    const competition = mapCompetition(rows[0]);
    const events = await prisma.$queryRawUnsafe<any[]>(
      `
        ${EVENT_PUBLIC_SELECT}
        WHERE competition_id = $1
        ORDER BY status = 'live' DESC, scheduled_at ASC
        LIMIT 200
      `,
      competition.id
    );

    res.json({
      success: true,
      data: {
        competition,
        events: events.map(mapPublicEvent),
        groups: competition.groupsData || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, archived } = req.query;

    const conditions: string[] = [];
    const values: unknown[] = [];
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}::competition_status`);
    }
    values.push(String(archived ?? 'false') === 'true');
    conditions.push(`archived = $${values.length}`);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        SELECT ${COMPETITION_SELECT}
        FROM "competitions"
        ${where}
        ORDER BY created_at DESC
      `,
      ...values
    );

    res.json({ success: true, data: rows.map(mapCompetition) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const body = req.body || {};

    const slug = String(body.slug || body.name || '').trim().toLowerCase().replace(/\s+/g, '-');
    const name = String(body.name || '').trim();

    if (!name) {
      res.status(400).json({ success: false, error: 'name obrigatorio' });
      return;
    }
    if (!slug) {
      res.status(400).json({ success: false, error: 'slug obrigatorio' });
      return;
    }

    const isFeaturedCard = body.isFeaturedCard === true;

    // Only one competition can be highlighted on the homepage CTA card, so
    // toggling it on for this one clears it from whichever competition had
    // it before.
    if (isFeaturedCard) {
      await prisma.$executeRawUnsafe(
        `UPDATE "competitions" SET is_featured_card = FALSE WHERE is_featured_card = TRUE`
      );
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "competitions" (
          name, slug, season, sport,
          description, thumbnail, banner,
          start_date, end_date, status, format,
          hero_badge, hero_badge_icon, hero_title_line1, hero_title_line2, hero_description,
          stat_teams, stat_games, stat_host_countries, stat_stadiums,
          host_countries, section_title, cta_title, cta_description, cta_button_text,
          groups_data, theme_color, is_featured_card
        )
        VALUES (
          $1, $2, $3, $4::sport_category,
          $5, $6, $7,
          $8::timestamptz, $9::timestamptz, $10::competition_status, $11::competition_format,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24, $25,
          $26::jsonb, $27, $28
        )
        RETURNING ${COMPETITION_SELECT}
      `,
      name,
      slug,
      body.season ?? null,
      body.sport ?? null,
      body.description ?? null,
      body.thumbnail ?? null,
      body.banner ?? null,
      body.startDate ?? null,
      body.endDate ?? null,
      body.status ?? 'active',
      body.format ?? 'groups',
      body.heroBadge ?? null,
      body.heroBadgeIcon ?? '🏆',
      body.heroTitleLine1 ?? null,
      body.heroTitleLine2 ?? null,
      body.heroDescription ?? null,
      body.statTeams ?? 0,
      body.statGames ?? 0,
      body.statHostCountries ?? 0,
      body.statStadiums ?? 0,
      body.hostCountries ?? null,
      body.sectionTitle ?? null,
      body.ctaTitle ?? null,
      body.ctaDescription ?? null,
      body.ctaButtonText ?? null,
      body.groupsData ? JSON.stringify(body.groupsData) : null,
      body.themeColor ?? null,
      isFeaturedCard
    );

    res.status(201).json({ success: true, data: mapCompetition(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.post('/sync-all', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const result = await syncAllCompetitions(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        SELECT ${COMPETITION_SELECT}
        FROM "competitions"
        WHERE id = $1
        LIMIT 1
      `,
      req.params.id
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Competicao nao encontrada' });
      return;
    }

    res.json({ success: true, data: mapCompetition(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const body = req.body || {};

    const slug = body.slug ? String(body.slug).trim().toLowerCase().replace(/\s+/g, '-') : null;
    const name = body.name ? String(body.name).trim() : null;

    // Only one competition can be highlighted on the homepage CTA card, so
    // toggling it on for this one clears it from whichever competition had
    // it before.
    if (body.isFeaturedCard === true) {
      await prisma.$executeRawUnsafe(
        `UPDATE "competitions" SET is_featured_card = FALSE WHERE id != $1 AND is_featured_card = TRUE`,
        req.params.id
      );
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "competitions"
        SET
          name = COALESCE($2, name),
          slug = COALESCE($3, slug),
          season = COALESCE($4, season),
          sport = COALESCE($5::sport_category, sport),
          description = COALESCE($6, description),
          thumbnail = COALESCE($7, thumbnail),
          banner = COALESCE($8, banner),
          start_date = COALESCE($9::timestamptz, start_date),
          end_date = COALESCE($10::timestamptz, end_date),
          status = COALESCE($11::competition_status, status),
          format = COALESCE($12::competition_format, format),
          hero_badge = COALESCE($13, hero_badge),
          hero_badge_icon = COALESCE($14, hero_badge_icon),
          hero_title_line1 = COALESCE($15, hero_title_line1),
          hero_title_line2 = COALESCE($16, hero_title_line2),
          hero_description = COALESCE($17, hero_description),
          stat_teams = COALESCE($18, stat_teams),
          stat_games = COALESCE($19, stat_games),
          stat_host_countries = COALESCE($20, stat_host_countries),
          stat_stadiums = COALESCE($21, stat_stadiums),
          host_countries = COALESCE($22, host_countries),
          section_title = COALESCE($23, section_title),
          cta_title = COALESCE($24, cta_title),
          cta_description = COALESCE($25, cta_description),
          cta_button_text = COALESCE($26, cta_button_text),
          groups_data = COALESCE($27::jsonb, groups_data),
          theme_color = COALESCE($28, theme_color),
          is_featured_card = COALESCE($29, is_featured_card),
          updated_at = NOW()
        WHERE id = $1
        RETURNING ${COMPETITION_SELECT}
      `,
      req.params.id,
      name,
      slug,
      body.season ?? null,
      body.sport ?? null,
      body.description ?? null,
      body.thumbnail ?? null,
      body.banner ?? null,
      body.startDate ?? null,
      body.endDate ?? null,
      body.status ?? null,
      body.format ?? null,
      body.heroBadge ?? null,
      body.heroBadgeIcon ?? null,
      body.heroTitleLine1 ?? null,
      body.heroTitleLine2 ?? null,
      body.heroDescription ?? null,
      body.statTeams ?? null,
      body.statGames ?? null,
      body.statHostCountries ?? null,
      body.statStadiums ?? null,
      body.hostCountries ?? null,
      body.sectionTitle ?? null,
      body.ctaTitle ?? null,
      body.ctaDescription ?? null,
      body.ctaButtonText ?? null,
      body.groupsData != null ? JSON.stringify(body.groupsData) : null,
      body.themeColor ?? null,
      typeof body.isFeaturedCard === 'boolean' ? body.isFeaturedCard : null
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Competicao nao encontrada' });
      return;
    }

    res.json({ success: true, data: mapCompetition(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/archive', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "competitions" SET archived = $2, updated_at = NOW() WHERE id = $1 RETURNING ${COMPETITION_SELECT}`,
      req.params.id, Boolean(req.body.archived ?? true)
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Competicao nao encontrada' });
      return;
    }
    res.json({ success: true, data: mapCompetition(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "competitions" WHERE id = $1`, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
