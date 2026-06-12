import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
});

export async function ensureRuntimeSchema() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "lives"
      ADD COLUMN IF NOT EXISTS "league_logo" TEXT,
      ADD COLUMN IF NOT EXISTS "stream_servers" JSONB,
      ADD COLUMN IF NOT EXISTS "like_count" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "share_count" INTEGER NOT NULL DEFAULT 0
  `);

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
