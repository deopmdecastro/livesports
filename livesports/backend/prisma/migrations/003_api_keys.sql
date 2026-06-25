-- =====================================================
-- LiveSports Migration 003 - API Keys Management
-- =====================================================

CREATE TYPE "api_key_status" AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE "api_usage_type" AS ENUM (
  'live_streams',
  'game_events',
  'game_data',
  'statistics',
  'competitions',
  'teams',
  'players',
  'shields',
  'logos',
  'flags',
  'standings',
  'odds',
  'news'
);

CREATE TABLE "api_keys" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"            VARCHAR(200) NOT NULL,
  "description"     TEXT,
  "provider"        VARCHAR(200) NOT NULL,
  "base_url"        TEXT,
  "key_value"       TEXT NOT NULL,
  "status"          "api_key_status" NOT NULL DEFAULT 'active',
  "priority"        INTEGER NOT NULL DEFAULT 1,
  "request_limit"   INTEGER,
  "requests_used"   INTEGER NOT NULL DEFAULT 0,
  "error_count"     INTEGER NOT NULL DEFAULT 0,
  "last_used_at"    TIMESTAMPTZ,
  "last_synced_at"  TIMESTAMPTZ,
  "expires_at"      TIMESTAMPTZ,
  "usage_types"     "api_usage_type"[] DEFAULT '{}',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "api_keys_status_idx" ON "api_keys"("status");
CREATE INDEX "api_keys_provider_idx" ON "api_keys"("provider");
CREATE INDEX "api_keys_priority_idx" ON "api_keys"("priority" DESC);
