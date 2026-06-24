import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { COMPETITION_SEEDS, getCompetitionSeedMedia } from './competition-seeds';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
});

async function enumHasValue(typeName: string, enumLabel: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = $1 AND e.enumlabel = $2
      ) AS "exists"
    `,
    typeName,
    enumLabel
  );

  return Boolean(rows[0]?.exists);
}

function isEnumOwnerError(error: unknown) {
  const details = error as { code?: string; meta?: { message?: string }; message?: string };
  const message = details.meta?.message || details.message || '';
  return details.code === 'P2010' && message.includes('must be owner of type');
}

export async function ensureRuntimeSchema() {
  let hasLivePrerollPosition = await enumHasValue('ad_position', 'live_preroll');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "lives"
      ADD COLUMN IF NOT EXISTS "league_logo" TEXT,
      ADD COLUMN IF NOT EXISTS "stream_servers" JSONB,
      ADD COLUMN IF NOT EXISTS "like_count" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "share_count" INTEGER NOT NULL DEFAULT 0
  `);

  if (!hasLivePrerollPosition) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TYPE "ad_position" ADD VALUE IF NOT EXISTS 'live_preroll'
      `);
      hasLivePrerollPosition = true;
    } catch (error) {
      if (!isEnumOwnerError(error)) throw error;
      console.warn('Skipping live_preroll ad seed: database user is not the owner of ad_position.');
    }
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "live_comments" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "live_id" TEXT NOT NULL,
      "client_id" TEXT,
      "user_name" VARCHAR(120) NOT NULL DEFAULT 'Visitante',
      "message" TEXT NOT NULL,
      "admin" BOOLEAN NOT NULL DEFAULT FALSE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "live_comments_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "live_comments_live_fk" FOREIGN KEY ("live_id") REFERENCES "lives"("id") ON DELETE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "live_comments_live_created_idx"
    ON "live_comments"("live_id", "created_at" DESC)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "live_reactions" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "live_id" TEXT NOT NULL,
      "client_id" TEXT NOT NULL,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "live_reactions_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "live_reactions_unique" UNIQUE ("live_id", "client_id"),
      CONSTRAINT "live_reactions_live_fk" FOREIGN KEY ("live_id") REFERENCES "lives"("id") ON DELETE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "live_views" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "live_id" TEXT NOT NULL,
      "client_id" TEXT,
      "ip" VARCHAR(80),
      "user_agent" TEXT,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "live_views_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "live_views_live_fk" FOREIGN KEY ("live_id") REFERENCES "lives"("id") ON DELETE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "live_views_live_created_idx"
    ON "live_views"("live_id", "created_at" DESC)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "live_shares" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "live_id" TEXT NOT NULL,
      "client_id" TEXT,
      "target" VARCHAR(80),
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "live_shares_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "live_shares_live_fk" FOREIGN KEY ("live_id") REFERENCES "lives"("id") ON DELETE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "league_logo" TEXT,
      ADD COLUMN IF NOT EXISTS "score_a" INTEGER,
      ADD COLUMN IF NOT EXISTS "score_b" INTEGER,
      ADD COLUMN IF NOT EXISTS "match_time" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "viewer_count" INTEGER NOT NULL DEFAULT 0
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "competition_status" AS ENUM ('active', 'draft', 'completed');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "competition_format" AS ENUM ('groups', 'league', 'knockout');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "competitions" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "name" VARCHAR(255) NOT NULL,
      "slug" VARCHAR(255) NOT NULL,
      "season" VARCHAR(50),
      "sport" "sport_category",
      "description" TEXT,
      "thumbnail" TEXT,
      "banner" TEXT,
      "start_date" TIMESTAMPTZ,
      "end_date" TIMESTAMPTZ,
      "status" "competition_status" NOT NULL DEFAULT 'active',
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "competitions_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "competitions_slug_unique" UNIQUE ("slug")
    )
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "competition_id" TEXT,
      ADD COLUMN IF NOT EXISTS "stage" VARCHAR(120),
      ADD COLUMN IF NOT EXISTS "round_number" INTEGER,
      ADD COLUMN IF NOT EXISTS "group_name" VARCHAR(120),
      ADD COLUMN IF NOT EXISTS "match_number" INTEGER
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "events"
        ADD CONSTRAINT "events_competition_fk"
        FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "events_competition_id_idx" ON "events"("competition_id")
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "competitions"
      ADD COLUMN IF NOT EXISTS "hero_badge" TEXT,
      ADD COLUMN IF NOT EXISTS "hero_badge_icon" TEXT DEFAULT '🏆',
      ADD COLUMN IF NOT EXISTS "hero_title_line1" TEXT,
      ADD COLUMN IF NOT EXISTS "hero_title_line2" TEXT,
      ADD COLUMN IF NOT EXISTS "hero_description" TEXT,
      ADD COLUMN IF NOT EXISTS "stat_teams" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "stat_games" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "stat_host_countries" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "stat_stadiums" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "host_countries" TEXT,
      ADD COLUMN IF NOT EXISTS "section_title" TEXT,
      ADD COLUMN IF NOT EXISTS "cta_title" TEXT,
      ADD COLUMN IF NOT EXISTS "cta_description" TEXT,
      ADD COLUMN IF NOT EXISTS "cta_button_text" TEXT,
      ADD COLUMN IF NOT EXISTS "groups_data" JSONB,
      ADD COLUMN IF NOT EXISTS "format" "competition_format" NOT NULL DEFAULT 'groups',
      ADD COLUMN IF NOT EXISTS "theme_color" VARCHAR(20)
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "venue" TEXT,
      ADD COLUMN IF NOT EXISTS "team_a_code" VARCHAR(10),
      ADD COLUMN IF NOT EXISTS "team_b_code" VARCHAR(10)
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "competitions" (
      "id", "name", "slug", "season", "sport", "description", "status", "format",
      "hero_badge", "hero_badge_icon", "hero_title_line1", "hero_title_line2", "hero_description",
      "stat_teams", "stat_games", "stat_host_countries", "stat_stadiums",
      "host_countries", "section_title", "cta_title", "cta_description", "cta_button_text",
      "theme_color", "thumbnail", "banner"
    )
    SELECT
      'comp-wc-2026', 'Copa do Mundo FIFA 2026', 'copa-do-mundo', '2026', 'football'::sport_category,
      'O maior espetáculo do futebol mundial.', 'active'::competition_status, 'groups'::competition_format,
      'FIFA World Cup 2026', '🏆', 'COPA DO MUNDO', 'FIFA 2026',
      'O maior espetáculo do futebol mundial. 48 seleções, 104 jogos ao vivo, transmitidos em HD com múltiplos servidores. EUA · Canadá · México.',
      48, 104, 3, 16,
      'EUA, Canadá e México',
      'Copa do Mundo FIFA 2026',
      'Não perca nenhum jogo da Copa do Mundo!',
      '104 jogos ao vivo · Transmissão em HD · Múltiplos servidores',
      'Assistir ao Vivo',
      '#FFD700',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/2026_FIFA_World_Cup.svg/120px-2026_FIFA_World_Cup.svg.png',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195778?auto=format&fit=crop&w=1600&q=80'
    WHERE NOT EXISTS (SELECT 1 FROM "competitions" WHERE "slug" = 'copa-do-mundo')
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "competitions"
    SET
      "theme_color" = COALESCE("theme_color", '#FFD700'),
      "thumbnail" = COALESCE("thumbnail", 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/2026_FIFA_World_Cup.svg/120px-2026_FIFA_World_Cup.svg.png'),
      "banner" = COALESCE("banner", 'https://images.unsplash.com/photo-1574629810360-7efbbe195778?auto=format&fit=crop&w=1600&q=80')
    WHERE "slug" = 'copa-do-mundo'
  `);

  for (const seed of COMPETITION_SEEDS) {
    const media = getCompetitionSeedMedia(seed.slug);
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "competitions" (
          "id", "name", "slug", "season", "sport", "description", "status", "format",
          "hero_badge", "hero_badge_icon", "hero_title_line1", "hero_title_line2",
          "host_countries", "section_title", "theme_color", "thumbnail", "banner"
        )
        SELECT
          $1, $2, $3, $4, 'football'::sport_category, $5, 'active'::competition_status, $6::competition_format,
          $7, $8, $9, $10, $11, $12, $13, $14, $15
        WHERE NOT EXISTS (SELECT 1 FROM "competitions" WHERE "slug" = $3)
      `,
      seed.id,
      seed.name,
      seed.slug,
      seed.season,
      seed.description,
      seed.format,
      seed.heroBadge ?? seed.name,
      seed.heroBadgeIcon ?? '⚽',
      seed.heroTitleLine1 ?? seed.name,
      seed.heroTitleLine2 ?? seed.season,
      seed.country,
      seed.sectionTitle ?? seed.name,
      media?.themeColor ?? null,
      media?.thumbnail ?? null,
      media?.banner ?? null
    );

    if (media) {
      await prisma.$executeRawUnsafe(
        `
          UPDATE "competitions"
          SET
            "theme_color" = COALESCE("theme_color", $2),
            "thumbnail" = COALESCE("thumbnail", $3),
            "banner" = COALESCE("banner", $4)
          WHERE "slug" = $1
        `,
        seed.slug,
        media.themeColor,
        media.thumbnail ?? null,
        media.banner ?? null
      );
    }
  }

  // ─── Migration 003: API Keys table ────────────────────────────────────────────
  try {
    const hasApiKeyStatus = await enumHasValue('api_key_status', 'active');
    if (!hasApiKeyStatus) {
      await prisma.$executeRawUnsafe(`CREATE TYPE IF NOT EXISTS "api_key_status" AS ENUM ('active', 'inactive', 'expired')`);
      await prisma.$executeRawUnsafe(`CREATE TYPE IF NOT EXISTS "api_usage_type" AS ENUM ('live_streams','game_events','game_data','statistics','competitions','teams','players','shields','logos','flags','standings','odds','news')`);
    }
  } catch { /* enums may already exist */ }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "api_keys" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "name" VARCHAR(200) NOT NULL,
      "description" TEXT,
      "provider" VARCHAR(200) NOT NULL,
      "base_url" TEXT,
      "key_value" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "priority" INTEGER NOT NULL DEFAULT 1,
      "request_limit" INTEGER,
      "requests_used" INTEGER NOT NULL DEFAULT 0,
      "error_count" INTEGER NOT NULL DEFAULT 0,
      "last_used_at" TIMESTAMPTZ,
      "last_synced_at" TIMESTAMPTZ,
      "expires_at" TIMESTAMPTZ,
      "usage_types" TEXT[] DEFAULT '{}',
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
    )
  `);

  // ─── Migration 004: System Logs table ──────────────────────────────────────
  try {
    const hasLogLevel = await enumHasValue('log_level', 'info');
    if (!hasLogLevel) {
      await prisma.$executeRawUnsafe(`CREATE TYPE IF NOT EXISTS "log_level" AS ENUM ('debug','info','warn','error','fatal')`);
      await prisma.$executeRawUnsafe(`CREATE TYPE IF NOT EXISTS "log_service" AS ENUM ('api','player','sync','auth','admin','database','stream','system')`);
    }
  } catch { /* enums may already exist */ }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "system_logs" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "level" TEXT NOT NULL DEFAULT 'info',
      "service" TEXT NOT NULL DEFAULT 'system',
      "message" TEXT NOT NULL,
      "details" JSONB,
      "user_id" TEXT,
      "request_id" TEXT,
      "ip" TEXT,
      "user_agent" TEXT,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "system_logs_created_at_idx" ON "system_logs"("created_at" DESC)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "system_logs_level_idx" ON "system_logs"("level")`);

  // ─── Migration 004b: Support Tickets ───────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`CREATE TYPE IF NOT EXISTS "ticket_status" AS ENUM ('open','pending','resolved','closed')`);
    await prisma.$executeRawUnsafe(`CREATE TYPE IF NOT EXISTS "ticket_priority" AS ENUM ('low','medium','high','critical')`);
    await prisma.$executeRawUnsafe(`CREATE TYPE IF NOT EXISTS "ticket_category" AS ENUM ('player','account','billing','stream','content','technical','other')`);
  } catch { /* enums may already exist */ }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "support_tickets" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "subject" VARCHAR(500) NOT NULL,
      "description" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'open',
      "priority" TEXT NOT NULL DEFAULT 'medium',
      "category" TEXT NOT NULL DEFAULT 'other',
      "user_id" TEXT,
      "assigned_to" TEXT,
      "resolved_at" TIMESTAMPTZ,
      "closed_at" TIMESTAMPTZ,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "support_messages" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "ticket_id" TEXT NOT NULL,
      "user_id" TEXT,
      "message" TEXT NOT NULL,
      "is_admin" BOOLEAN NOT NULL DEFAULT FALSE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "support_messages_ticket_fk" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE
    )
  `);

  // ─── Migration 004c: import tracking columns ────────────────────────────────
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "import_source" TEXT,
      ADD COLUMN IF NOT EXISTS "import_date" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT FALSE
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "lives"
      ADD COLUMN IF NOT EXISTS "import_source" TEXT,
      ADD COLUMN IF NOT EXISTS "import_date" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "origin_quality" TEXT,
      ADD COLUMN IF NOT EXISTS "origin_language" TEXT,
      ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT FALSE
  `);

  const password = bcrypt.hashSync('admin123', 12);
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "users" ("id", "name", "email", "email_verified", "password", "role", "status")
      VALUES ('admin-001', 'Administrador', 'admin@livesports.com', TRUE, $1, 'super_admin', 'active')
      ON CONFLICT ("email") DO UPDATE
      SET "password" = EXCLUDED."password", "role" = 'super_admin', "status" = 'active', "email_verified" = TRUE
    `,
    password
  );

  if (process.env.ALLOW_DEMO_DATA === 'true') {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "lives" (
        "id", "title", "description", "thumbnail", "sport", "league", "league_logo",
        "team_a", "team_a_logo", "team_b", "team_b_logo", "score_a", "score_b",
        "hls_url", "status", "featured", "viewer_count", "total_views", "like_count", "share_count", "match_time",
        "stream_servers", "scheduled_at"
      )
      SELECT 'live-001', 'Manchester United vs Liverpool', 'Premier League ao vivo.',
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
        'football'::sport_category, 'Premier League', 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
        'Man. United', 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
        'Liverpool', 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
        2, 1, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        'live'::live_status, TRUE, 125400, 125400, 0, 0, '75''',
        '[{"id":"auto","name":"Servidor Auto","quality":"Auto HD","latency":"Baixa","url":"https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"},{"id":"backup","name":"Backup HLS","quality":"HD","latency":"Media","url":"https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"}]'::jsonb,
        NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "lives")
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "events" (
        "id", "title", "description", "thumbnail", "sport", "league", "league_logo",
        "team_a", "team_a_logo", "team_b", "team_b_logo", "score_a", "score_b",
        "match_time", "viewer_count", "scheduled_at", "status"
      )
      SELECT 'live-001', 'Manchester United vs Liverpool', 'Premier League ao vivo.',
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80',
        'football'::sport_category, 'Premier League', 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
        'Man. United', 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
        'Liverpool', 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
        2, 1, '75''', 125400, NOW(), 'live'::event_status
      WHERE NOT EXISTS (SELECT 1 FROM "events")
    `);
  }

  if (hasLivePrerollPosition) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ads" ("id", "title", "campaign", "position", "format", "content", "image_url", "video_url", "click_url", "status")
      SELECT 'ad-live-preroll-001', 'Pre-roll imagem da live', 'Live antes de reproduzir', 'live_preroll'::ad_position, 'banner'::ad_format,
        'Anuncio em imagem antes da transmissao ao vivo',
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80',
        NULL,
        'https://livesports.com/', 'active'::ad_status
      WHERE NOT EXISTS (SELECT 1 FROM "ads" WHERE "position" = 'live_preroll')
    `);
  }

  await prisma.$executeRawUnsafe(`
    INSERT INTO "ads" ("id", "title", "campaign", "position", "format", "content", "image_url", "video_url", "click_url", "status")
    SELECT 'ad-player-001', 'Pre-roll principal', 'Big Buck Bunny', 'player'::ad_position, 'video'::ad_format,
      'Anuncio antes da transmissao',
      'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://peach.blender.org/', 'active'::ad_status
    WHERE NOT EXISTS (SELECT 1 FROM "ads" WHERE "position" = 'player')
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "ads"
    SET "position" = 'player'::ad_position,
      "format" = 'video'::ad_format,
      "video_url" = COALESCE("video_url", 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
      "image_url" = COALESCE("image_url", 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217')
    WHERE "id" = 'ad-player-001'
  `);
}
