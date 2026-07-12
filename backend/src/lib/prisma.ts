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

async function ensureEnumValue(typeName: string, enumLabel: string) {
  let hasValue = false;
  try {
    hasValue = await enumHasValue(typeName, enumLabel);
  } catch {
    hasValue = false;
  }
  if (hasValue) return;

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "${typeName}" ADD VALUE '${enumLabel}'`);
  } catch (error: any) {
    const msg: string = error?.message || String(error);
    if (!isEnumOwnerError(error) && !msg.includes('already exists') && !msg.includes('duplicate')) {
      throw error;
    }
  }
}

export async function ensureRuntimeSchema() {
  try {
    let hasLivePrerollPosition = await enumHasValue('ad_position', 'live_preroll');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "lives"
      ADD COLUMN IF NOT EXISTS "league_logo" TEXT,
      ADD COLUMN IF NOT EXISTS "stream_servers" JSONB,
      ADD COLUMN IF NOT EXISTS "youtube_url" TEXT,
      ADD COLUMN IF NOT EXISTS "youtube_embed" TEXT,
      ADD COLUMN IF NOT EXISTS "like_count" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "share_count" INTEGER NOT NULL DEFAULT 0
  `);

  if (!hasLivePrerollPosition) {
    try {
      // ALTER TYPE ... ADD VALUE does NOT support IF NOT EXISTS in PostgreSQL.
      // The enumHasValue check above already guards this — but if the enum was
      // created in a different transaction or by another process, we catch the
      // duplicate gracefully.
      await prisma.$executeRawUnsafe(`
        ALTER TYPE "ad_position" ADD VALUE 'live_preroll'
      `);
      hasLivePrerollPosition = true;
    } catch (error: any) {
      const msg: string = error?.message || String(error);
      if (isEnumOwnerError(error) || msg.includes('already exists') || msg.includes('duplicate')) {
        hasLivePrerollPosition = true; // it's already there
      } else {
        throw error;
      }
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
      ADD COLUMN IF NOT EXISTS "theme_color" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "is_featured_card" BOOLEAN NOT NULL DEFAULT FALSE
  `);

  // Only one competition can be highlighted on the homepage CTA card at a time.
  // A partial unique index enforces that at the DB level regardless of which
  // route/admin flow flips the flag.
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "competitions_single_featured_card_idx"
      ON "competitions" (("is_featured_card"))
      WHERE "is_featured_card" = TRUE
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "venue" TEXT,
      ADD COLUMN IF NOT EXISTS "team_a_code" VARCHAR(10),
      ADD COLUMN IF NOT EXISTS "team_b_code" VARCHAR(10)
  `);

  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "competitions" (
        "id", "name", "slug", "season", "sport", "description", "status", "format",
        "hero_badge", "hero_badge_icon", "hero_title_line1", "hero_title_line2", "hero_description",
        "stat_teams", "stat_games", "stat_host_countries", "stat_stadiums",
        "host_countries", "section_title", "cta_title", "cta_description", "cta_button_text",
        "theme_color", "thumbnail", "banner", "is_featured_card"
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
        'https://images.unsplash.com/photo-1574629810360-7efbbe195778?auto=format&fit=crop&w=1600&q=80',
        TRUE
      WHERE NOT EXISTS (SELECT 1 FROM "competitions" WHERE "slug" = 'copa-do-mundo')
    `);
  } catch (seedErr: unknown) {
    const msg = seedErr instanceof Error ? seedErr.message : String(seedErr);
    console.warn('[ensureRuntimeSchema] Competition seed skipped:', msg);
  }

  await prisma.$executeRawUnsafe(`
    UPDATE "competitions"
    SET
      "theme_color" = COALESCE("theme_color", '#FFD700'),
      "thumbnail" = COALESCE("thumbnail", 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/2026_FIFA_World_Cup.svg/120px-2026_FIFA_World_Cup.svg.png'),
      "banner" = COALESCE("banner", 'https://images.unsplash.com/photo-1574629810360-7efbbe195778?auto=format&fit=crop&w=1600&q=80')
    WHERE "slug" = 'copa-do-mundo'
  `);

  // Existing installs upgrading from before "is_featured_card" existed won't have
  // any competition flagged yet — default the World Cup to featured so the
  // homepage CTA card keeps working exactly as before until an admin changes it.
  await prisma.$executeRawUnsafe(`
    UPDATE "competitions"
    SET "is_featured_card" = TRUE
    WHERE "slug" = 'copa-do-mundo'
      AND NOT EXISTS (SELECT 1 FROM "competitions" WHERE "is_featured_card" = TRUE)
  `);

  for (const seed of COMPETITION_SEEDS) {
    try {
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
    } catch (seedErr: unknown) {
      const msg = seedErr instanceof Error ? seedErr.message : String(seedErr);
      console.warn(`[ensureRuntimeSchema] Seed skipped for "${seed.slug}":`, msg.split('\n')[0]);
    }
  }

  // ─── Migrations 003-005: API Keys, Logs, Support, Archive columns ──────────────
  // These are wrapped in individual try/catch so a single failure doesn't block boot
  const safeExec = async (sql: string) => {
    try { await prisma.$executeRawUnsafe(sql); } catch (e: any) { if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) console.error('[safeExec]', (e as Error).message?.split('\n')[0]); }
  };

  // api_keys table — create enums first
  await safeExec(`DO $$ BEGIN CREATE TYPE "api_key_status" AS ENUM ('active', 'inactive', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`DO $$ BEGIN CREATE TYPE "api_usage_type" AS ENUM ('live_streams', 'game_events', 'game_data', 'statistics', 'competitions', 'teams', 'players', 'shields', 'logos', 'flags', 'standings', 'odds', 'news'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`
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

  await safeExec(`DO $$ BEGIN CREATE TYPE "log_level" AS ENUM ('debug', 'info', 'warn', 'error', 'fatal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`DO $$ BEGIN CREATE TYPE "log_service" AS ENUM ('api', 'player', 'sync', 'auth', 'admin', 'database', 'stream', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`DO $$ BEGIN CREATE TYPE "ticket_status" AS ENUM ('open', 'pending', 'resolved', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`DO $$ BEGIN CREATE TYPE "ticket_priority" AS ENUM ('low', 'medium', 'high', 'critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`DO $$ BEGIN CREATE TYPE "ticket_category" AS ENUM ('player', 'account', 'billing', 'stream', 'content', 'technical', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`DO $$ BEGIN CREATE TYPE "notification_type" AS ENUM ('info', 'success', 'warning', 'error', 'live', 'new_ticket', 'ticket_reply', 'ticket_status_change', 'poll_milestone', 'creator_application', 'channel_status_change', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

  await ensureEnumValue('notification_type', 'info');
  await ensureEnumValue('notification_type', 'success');
  await ensureEnumValue('notification_type', 'warning');
  await ensureEnumValue('notification_type', 'error');
  await ensureEnumValue('notification_type', 'live');
  await ensureEnumValue('notification_type', 'new_ticket');
  await ensureEnumValue('notification_type', 'ticket_reply');
  await ensureEnumValue('notification_type', 'ticket_status_change');
  await ensureEnumValue('notification_type', 'poll_milestone');
  await ensureEnumValue('notification_type', 'creator_application');
  await ensureEnumValue('notification_type', 'channel_status_change');
  await ensureEnumValue('notification_type', 'system');

  // system_logs table
  await safeExec(`
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
  await safeExec(`ALTER TABLE "system_logs" ALTER COLUMN "level" TYPE "log_level" USING "level"::"log_level"`);
  await safeExec(`ALTER TABLE "system_logs" ALTER COLUMN "service" TYPE "log_service" USING "service"::"log_service"`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "system_logs_created_at_idx" ON "system_logs"("created_at" DESC)`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "system_logs_level_idx" ON "system_logs"("level")`);
  await safeExec(`ALTER TABLE "system_logs" ADD COLUMN IF NOT EXISTS "ip_country" TEXT`);
  // creator_applications table
  await safeExec(`DO $$ BEGIN CREATE TYPE "creator_app_status" AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`
    CREATE TABLE IF NOT EXISTS "creator_applications" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "user_id" TEXT NOT NULL,
      "channel_name" VARCHAR(200) NOT NULL,
      "description" TEXT,
      "sport" TEXT,
      "social_links" JSONB DEFAULT '{}',
      "status" TEXT DEFAULT 'pending',
      "admin_notes" TEXT,
      "reviewed_by" TEXT,
      "reviewed_at" TIMESTAMPTZ,
      "created_at" TIMESTAMPTZ DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await safeExec(`ALTER TABLE "creator_applications" ALTER COLUMN "status" TYPE "creator_app_status" USING "status"::"creator_app_status"`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "idx_creator_applications_user" ON "creator_applications"("user_id")`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "idx_creator_applications_status" ON "creator_applications"("status")`);

  // channels table
  await safeExec(`DO $$ BEGIN CREATE TYPE "channel_status" AS ENUM ('active', 'suspended', 'pending', 'inactive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await safeExec(`
    CREATE TABLE IF NOT EXISTS "channels" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "user_id" TEXT NOT NULL,
      "name" VARCHAR(200) NOT NULL,
      "slug" VARCHAR(200) UNIQUE NOT NULL,
      "description" TEXT,
      "avatar" TEXT,
      "banner" TEXT,
      "sport" TEXT,
      "country" TEXT,
      "status" TEXT DEFAULT 'pending',
      "verified" BOOLEAN DEFAULT false,
      "subscriber_count" INTEGER DEFAULT 0,
      "total_views" INTEGER DEFAULT 0,
      "live_count" INTEGER DEFAULT 0,
      "website_url" TEXT,
      "social_links" JSONB DEFAULT '{}',
      "created_at" TIMESTAMPTZ DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await safeExec(`ALTER TABLE "channels" ALTER COLUMN "status" TYPE "channel_status" USING "status"::"channel_status"`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "idx_channels_user" ON "channels"("user_id")`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "idx_channels_status" ON "channels"("status")`);

  // channel_subscriptions table
  await safeExec(`
    CREATE TABLE IF NOT EXISTS "channel_subscriptions" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "channel_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "created_at" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("channel_id","user_id")
    )
  `);


  await safeExec(`CREATE INDEX IF NOT EXISTS "system_logs_ip_country_idx" ON "system_logs"("ip_country")`);

  // support_tickets table
  await safeExec(`
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
  await safeExec(`
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
  await safeExec(`ALTER TABLE "support_tickets" ALTER COLUMN "status" TYPE "ticket_status" USING "status"::"ticket_status"`);
  await safeExec(`ALTER TABLE "support_tickets" ALTER COLUMN "priority" TYPE "ticket_priority" USING "priority"::"ticket_priority"`);
  await safeExec(`ALTER TABLE "support_tickets" ALTER COLUMN "category" TYPE "ticket_category" USING "category"::"ticket_category"`);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "user_id" TEXT,
      "type" "notification_type" NOT NULL DEFAULT 'system',
      "title" VARCHAR(300) NOT NULL,
      "message" TEXT,
      "link" TEXT,
      "meta" JSONB DEFAULT '{}'::jsonb,
      "read" BOOLEAN NOT NULL DEFAULT FALSE,
      "read_at" TIMESTAMPTZ,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeExec(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "notification_type" USING "type"::"notification_type"`);
  await safeExec(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "link" TEXT`);
  await safeExec(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "meta" JSONB DEFAULT '{}'::jsonb`);
  await safeExec(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMPTZ`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications"("user_id", "read")`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at" DESC)`);

  await safeExec(`ALTER TABLE "news_articles" ADD COLUMN IF NOT EXISTS "language" TEXT`);
  await safeExec(`ALTER TABLE "news_articles" ADD COLUMN IF NOT EXISTS "translation_of_id" TEXT`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "news_articles_translation_of_id_idx" ON "news_articles"("translation_of_id")`);

  // ─── Site settings (branding) ───────────────────────────────────────────────
  // Persisted centrally so the footer/navbar logo and other branding survive
  // server restarts. Auto-created here so local dev (which runs `npm run dev`
  // without `prisma migrate deploy`) works without a separate migration step.
  await safeExec(`
    CREATE TABLE IF NOT EXISTS "site_settings" (
      "key" TEXT PRIMARY KEY,
      "value" JSONB NOT NULL,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Archive + import tracking columns for events, lives, competitions
  await safeExec(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "import_source" TEXT`);
  await safeExec(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "import_date" TIMESTAMPTZ`);
  await safeExec(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT FALSE`);
  await safeExec(`ALTER TABLE "lives" ADD COLUMN IF NOT EXISTS "import_source" TEXT`);
  await safeExec(`ALTER TABLE "lives" ADD COLUMN IF NOT EXISTS "import_date" TIMESTAMPTZ`);
  await safeExec(`ALTER TABLE "lives" ADD COLUMN IF NOT EXISTS "origin_quality" TEXT`);
  await safeExec(`ALTER TABLE "lives" ADD COLUMN IF NOT EXISTS "origin_language" TEXT`);
  await safeExec(`ALTER TABLE "lives" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT FALSE`);
  await safeExec(`ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT FALSE`);

  // Seed default admin user if none exists
  const adminExists = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
    `SELECT COUNT(*)::text AS count FROM "users" WHERE "role" IN ('admin', 'super_admin') LIMIT 1`
  ).catch(() => [{ count: '0' }]);

  if (parseInt((adminExists[0] as { count: string })?.count ?? '0', 10) === 0) {
    const seedAdminPw = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const password = bcrypt.hashSync(seedAdminPw, 12);
    const insertAdmin = async () => {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO "users" ("name", "email", "password", "role", "status", "email_verified")
          VALUES ($1, $2, $3, $4, 'active', TRUE)
          ON CONFLICT ("email") DO NOTHING
        `,
        'Administrador',
        'admin@livesports.com',
        password,
        'super_admin'
      );
    };
    try { await insertAdmin(); } catch { /* column/table may already exist */ }
  }

  // ─── Seed demo users (creator + user) ───────────────────────────────────
  const demoPassword = bcrypt.hashSync(process.env.SEED_USER_PASSWORD || 'User12345!', 12);
  const demoCreatorPassword = bcrypt.hashSync(process.env.SEED_CREATOR_PASSWORD || 'Creator123!', 12);

  await prisma.$executeRawUnsafe(
    `INSERT INTO "users" ("name", "email", "password", "role", "status", "email_verified", "email_verified_at")
     VALUES ($1, $2, $3, 'creator', 'active', TRUE, NOW())
     ON CONFLICT ("email") DO NOTHING`,
    'Criador Demo', 'creator@livesports.local', demoCreatorPassword
  ).catch(() => {});

  await prisma.$executeRawUnsafe(
    `INSERT INTO "users" ("name", "email", "password", "role", "status", "email_verified", "email_verified_at")
     VALUES ($1, $2, $3, 'user', 'active', TRUE, NOW())
     ON CONFLICT ("email") DO NOTHING`,
    'Utilizador Demo', 'user@livesports.local', demoPassword
  ).catch(() => {});

  // Demo creator channel
  try {
    const creatorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "users" WHERE email = 'creator@livesports.local' LIMIT 1`
    ).catch(() => []);
    const creatorId = creatorRows[0]?.id;
    if (creatorId) {
      const chExists = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
        `SELECT COUNT(*)::text AS count FROM "channels" WHERE user_id = $1`, creatorId
      ).catch(() => [{ count: '0' }]);
      if (parseInt(chExists[0]?.count || '0', 10) === 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "channels" ("user_id", "name", "slug", "description", "avatar", "banner", "sport", "country", "website_url", "social_links", "status", "verified", "subscriber_count", "total_views", "live_count")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, 'active', TRUE, 1250, 84210, 12)
           ON CONFLICT ("slug") DO NOTHING`,
          creatorId,
          'Canal Demo LiveSports',
          'canal-demo-livesports',
          'Canal de demonstracao para testar o Creator Studio.',
          'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1600&q=80',
          'football', 'Portugal', 'https://livesports.local/creator',
          JSON.stringify({ website: 'https://livesports.local/creator', instagram: '@livesports_creator' }),
        ).catch(() => {});
        console.log('[ensureRuntimeSchema] Demo creator channel created');
      }
    }
  } catch { /* non-critical */ }

  const adminRows = await prisma.$queryRawUnsafe<Array<{ id: string; password: string }>>(
    `SELECT id, password FROM "users" WHERE email = 'admin@livesports.com' LIMIT 1`
  ).catch(() => []);

  const defaultAdmin = adminRows[0];
  if (defaultAdmin && !bcrypt.compareSync('admin123', defaultAdmin.password)) {
    const seedAdminPw = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const password = bcrypt.hashSync(seedAdminPw, 12);
    await prisma.$executeRawUnsafe(
      `UPDATE "users" SET "password" = $1 WHERE id = $2`,
      password,
      defaultAdmin.id
    );
    console.warn('[ensureRuntimeSchema] admin@livesports.com password reset to documented default');
  }

  // ─── Seed demo notifications (if table is empty) ──────────────────────────
  try {
    const notifCount = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
      `SELECT COUNT(*)::text AS count FROM "notifications"`
    ).catch(() => [{ count: '0' }]);
    
    if (parseInt(notifCount[0]?.count || '0', 10) === 0) {
      const adminRows2 = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "users" WHERE role = 'super_admin' LIMIT 1`
      ).catch(() => []);
      const adminId = adminRows2[0]?.id;

      const seedNotifs = [
        { type: 'live', title: 'Nova live iniciada: Benfica vs Porto', message: 'O classico portugues comecou! Acompanha em direto.', link: '/watch/live-demo-1' },
        { type: 'info', title: 'Novo utilizador registado: carlos@exemplo.com', message: 'Carlos Oliveira juntou-se a plataforma.', link: '/admin/users' },
        { type: 'warning', title: 'Anuncio #003 a aproximar-se do limite de impressoes', message: 'O anuncio "Promocao Nike" atingiu 95% do limite.', link: '/admin/ads' },
        { type: 'system', title: 'Relatorio mensal de Julho disponivel', message: 'O relatorio de estatisticas de Julho 2026 ja esta disponivel para download.', link: '/admin/reports' },
        { type: 'success', title: 'Novo canal de criador aprovado', message: 'O canal "Futebol Total" foi aprovado e esta ativo.', link: '/admin/creators' },
        { type: 'error', title: 'Erro na sincronizacao de eventos', message: 'Falha ao sincronizar eventos da API Football. Verifica as credenciais.', link: '/admin/api-keys' },
        { type: 'info', title: 'Bem-vindo ao painel LiveSports!', message: 'Explora as funcionalidades do teu painel de administracao.', link: '/admin/dashboard' },
        { type: 'creator_application', title: 'Nova candidatura a criador: Joao Silva', message: 'Joao Silva (joao@exemplo.com) candidatou-se ao programa de criadores.', link: '/admin/creators' },
        { type: 'success', title: 'Backup da base de dados concluido', message: 'O backup automatico foi concluido com sucesso.', link: null },
        { type: 'system', title: 'Manutencao programada: Domingo 03:00 UTC', message: 'A plataforma estara indisponivel por aproximadamente 15 minutos.', link: null },
      ];

      if (adminId) {
        for (let i = 0; i < seedNotifs.length; i++) {
          const n = seedNotifs[i];
          const createdDate = new Date(Date.now() - i * 3600000 * (i + 1));
          await prisma.$executeRawUnsafe(
            `INSERT INTO "notifications" ("user_id", "type", "title", "message", "link", "read", "read_at", "created_at")
             VALUES ($1, $2::notification_type, $3, $4, $5, $6, $7, $8)`,
            adminId, n.type, n.title, n.message, n.link,
            i >= 3, // first 3 unread, rest read
            i >= 3 ? new Date(Date.now() - i * 1800000).toISOString() : null,
            createdDate.toISOString()
          );
        }
        console.log(`[ensureRuntimeSchema] Seeded ${seedNotifs.length} demo notifications`);
      }
    }
  } catch (notifErr: any) {
    console.warn('[ensureRuntimeSchema] Notification seed skipped:', notifErr?.message || String(notifErr));
  }

  } catch (_error: any) {
    console.error('[ensureRuntimeSchema] Non-fatal error:', _error?.message || String(_error));
    console.error('  The server will continue, but some features may not work.');
  }
}