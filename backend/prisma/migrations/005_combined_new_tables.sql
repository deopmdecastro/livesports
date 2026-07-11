-- =====================================================================
-- LiveSports Migration 005 - API Keys, Logs, Support, Archive columns
-- Run this on your Supabase SQL Editor or psql if tables don't exist
-- =====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── API KEYS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"          VARCHAR(200) NOT NULL,
  "description"   TEXT,
  "provider"      VARCHAR(200) NOT NULL,
  "base_url"      TEXT,
  "key_value"     TEXT        NOT NULL,
  "status"        TEXT        NOT NULL DEFAULT 'active',
  "priority"      INTEGER     NOT NULL DEFAULT 1,
  "request_limit" INTEGER,
  "requests_used" INTEGER     NOT NULL DEFAULT 0,
  "error_count"   INTEGER     NOT NULL DEFAULT 0,
  "last_used_at"  TIMESTAMPTZ,
  "last_synced_at" TIMESTAMPTZ,
  "expires_at"    TIMESTAMPTZ,
  "usage_types"   TEXT[]      DEFAULT '{}',
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "api_keys_status_idx"   ON "api_keys"("status");
CREATE INDEX IF NOT EXISTS "api_keys_provider_idx" ON "api_keys"("provider");
CREATE INDEX IF NOT EXISTS "api_keys_priority_idx" ON "api_keys"("priority" DESC);

-- ── SYSTEM LOGS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "system_logs" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "level"       TEXT        NOT NULL DEFAULT 'info',
  "service"     TEXT        NOT NULL DEFAULT 'system',
  "message"     TEXT        NOT NULL,
  "details"     JSONB,
  "user_id"     TEXT,
  "request_id"  TEXT,
  "ip"          TEXT,
  "user_agent"  TEXT,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "system_logs_created_at_idx" ON "system_logs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "system_logs_level_idx"      ON "system_logs"("level");
CREATE INDEX IF NOT EXISTS "system_logs_service_idx"    ON "system_logs"("service");

-- ── SUPPORT TICKETS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "subject"     VARCHAR(500) NOT NULL,
  "description" TEXT        NOT NULL,
  "status"      TEXT        NOT NULL DEFAULT 'open',
  "priority"    TEXT        NOT NULL DEFAULT 'medium',
  "category"    TEXT        NOT NULL DEFAULT 'other',
  "user_id"     TEXT,
  "assigned_to" TEXT,
  "resolved_at" TIMESTAMPTZ,
  "closed_at"   TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_messages" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "ticket_id"  TEXT        NOT NULL,
  "user_id"    TEXT,
  "message"    TEXT        NOT NULL,
  "is_admin"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_messages_ticket_fk"
    FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "support_tickets_status_idx"     ON "support_tickets"("status");
CREATE INDEX IF NOT EXISTS "support_tickets_created_at_idx" ON "support_tickets"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "support_messages_ticket_id_idx" ON "support_messages"("ticket_id");

-- ── ADD ARCHIVE + IMPORT TRACKING COLUMNS ────────────────────────────
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "import_source"   TEXT,
  ADD COLUMN IF NOT EXISTS "import_date"     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "archived"        BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "lives"
  ADD COLUMN IF NOT EXISTS "import_source"   TEXT,
  ADD COLUMN IF NOT EXISTS "import_date"     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "origin_quality"  TEXT,
  ADD COLUMN IF NOT EXISTS "origin_language" TEXT,
  ADD COLUMN IF NOT EXISTS "archived"        BOOLEAN NOT NULL DEFAULT FALSE;

-- add archived column to competitions if not present
DO $$
BEGIN
  IF to_regclass('public.competitions') IS NOT NULL THEN
    EXECUTE '
      ALTER TABLE "competitions"
        ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT FALSE
    ';

    EXECUTE '
      CREATE INDEX IF NOT EXISTS "competitions_archived_idx"
      ON "competitions"("archived")
    ';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "events_archived_idx"       ON "events"("archived");
CREATE INDEX IF NOT EXISTS "lives_archived_idx"        ON "lives"("archived");
