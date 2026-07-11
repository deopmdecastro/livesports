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
      ADD COLUMN IF NOT EXISTS "theme_color" VARCHAR(20)
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
    try { await prisma.$executeRawUnsafe(sql); } catch { /* column/table may already exist */ }
  };

  // api_keys table
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
  await safeExec(`CREATE INDEX IF NOT EXISTS "system_logs_created_at_idx" ON "system_logs"("created_at" DESC)`);
  await safeExec(`CREATE INDEX IF NOT EXISTS "system_logs_level_idx" ON "system_logs"("level")`);

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
    const password = bcrypt.hashSync('admin123', 12);
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

  const adminRows = await prisma.$queryRawUnsafe<Array<{ id: string; password: string }>>(
    `SELECT id, password FROM "users" WHERE email = 'admin@livesports.com' LIMIT 1`
  ).catch(() => []);

  const defaultAdmin = adminRows[0];
  if (defaultAdmin && !bcrypt.compareSync('admin123', defaultAdmin.password)) {
    const password = bcrypt.hashSync('admin123', 12);
    await prisma.$executeRawUnsafe(
      `UPDATE "users" SET "password" = $1 WHERE id = $2`,
      password,
      defaultAdmin.id
    );
    console.warn('[ensureRuntimeSchema] admin@livesports.com password reset to documented default');
  }
  } catch (_error: any) {
    console.error('[ensureRuntimeSchema] Non-fatal error:', _error?.message || String(_error));
    console.error('  The server will continue, but some features may not work.');
  }
}