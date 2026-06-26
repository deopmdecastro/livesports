-- Lives table
CREATE TABLE IF NOT EXISTS "lives" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "thumbnail" TEXT,
  "banner" TEXT,
  "sport" TEXT NOT NULL DEFAULT 'football',
  "league" TEXT,
  "league_logo" TEXT,
  "team_a" TEXT,
  "team_a_logo" TEXT,
  "team_b" TEXT,
  "team_b_logo" TEXT,
  "score_a" INTEGER,
  "score_b" INTEGER,
  "stream_url" TEXT,
  "hls_url" TEXT,
  "m3u8_url" TEXT,
  "youtube_url" TEXT,
  "youtube_embed" TEXT,
  "stream_servers" JSONB DEFAULT '[]'::jsonb,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "featured" BOOLEAN DEFAULT FALSE,
  "viewer_count" INTEGER DEFAULT 0,
  "total_views" INTEGER DEFAULT 0,
  "like_count" INTEGER DEFAULT 0,
  "share_count" INTEGER DEFAULT 0,
  "match_time" TEXT,
  "tags" TEXT[] DEFAULT '{}'::TEXT[],
  "scheduled_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "started_at" TIMESTAMPTZ,
  "ended_at" TIMESTAMPTZ,
  "archived" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_lives_status" ON "lives" ("status");
CREATE INDEX IF NOT EXISTS "idx_lives_featured" ON "lives" ("featured");
CREATE INDEX IF NOT EXISTS "idx_lives_scheduled_at" ON "lives" ("scheduled_at" DESC);

-- Enable RLS
ALTER TABLE "lives" ENABLE ROW LEVEL SECURITY;

-- Policies for lives (public read for active lives)
CREATE POLICY "lives_select_public" ON "lives" FOR SELECT
  TO anon, authenticated
  USING ("status" = 'live' OR "status" = 'scheduled' OR "archived" = FALSE);

-- API Keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "provider" VARCHAR(200) NOT NULL,
  "base_url" TEXT,
  "key_value" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "priority" INTEGER DEFAULT 1,
  "request_limit" INTEGER,
  "requests_used" INTEGER DEFAULT 0,
  "error_count" INTEGER DEFAULT 0,
  "last_used_at" TIMESTAMPTZ,
  "last_synced_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "usage_types" TEXT[] DEFAULT '{}'::TEXT[],
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on api_keys
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access api_keys
CREATE POLICY "api_keys_select_authenticated" ON "api_keys" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "api_keys_insert_authenticated" ON "api_keys" FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "api_keys_update_authenticated" ON "api_keys" FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "api_keys_delete_authenticated" ON "api_keys" FOR DELETE
  TO authenticated
  USING (true);

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "email_verified" BOOLEAN DEFAULT FALSE,
  "email_verified_at" TIMESTAMPTZ,
  "password" TEXT NOT NULL,
  "avatar" TEXT,
  "country" TEXT,
  "phone" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "status" TEXT NOT NULL DEFAULT 'active',
  "two_factor_enabled" BOOLEAN DEFAULT FALSE,
  "two_factor_secret" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "users_select_own" ON "users" FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "id");

CREATE POLICY "users_update_own" ON "users" FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "id")
  WITH CHECK (auth.uid()::text = "id");