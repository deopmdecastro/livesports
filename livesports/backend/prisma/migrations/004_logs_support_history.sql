-- =====================================================
-- LiveSports Migration 004 - Logs, Support, History
-- =====================================================

-- ==================== SYSTEM LOGS ====================
CREATE TYPE "log_level" AS ENUM ('debug', 'info', 'warn', 'error', 'fatal');
CREATE TYPE "log_service" AS ENUM (
  'api', 'player', 'sync', 'auth', 'admin', 'database', 'stream', 'system'
);

CREATE TABLE "system_logs" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "level"       "log_level" NOT NULL DEFAULT 'info',
  "service"     "log_service" NOT NULL DEFAULT 'system',
  "message"     TEXT NOT NULL,
  "details"     JSONB,
  "user_id"     TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "request_id"  TEXT,
  "ip"          TEXT,
  "user_agent"  TEXT,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");
CREATE INDEX "system_logs_service_idx" ON "system_logs"("service");
CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at" DESC);
CREATE INDEX "system_logs_user_id_idx" ON "system_logs"("user_id");

-- ==================== SUPPORT TICKETS ====================
CREATE TYPE "ticket_status" AS ENUM ('open', 'pending', 'resolved', 'closed');
CREATE TYPE "ticket_priority" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "ticket_category" AS ENUM (
  'player', 'account', 'billing', 'stream', 'content', 'technical', 'other'
);

CREATE TABLE "support_tickets" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "subject"     VARCHAR(500) NOT NULL,
  "description" TEXT NOT NULL,
  "status"      "ticket_status" NOT NULL DEFAULT 'open',
  "priority"    "ticket_priority" NOT NULL DEFAULT 'medium',
  "category"    "ticket_category" NOT NULL DEFAULT 'other',
  "user_id"     TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "assigned_to" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" TIMESTAMPTZ,
  "closed_at"   TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_messages" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "ticket_id" TEXT NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
  "user_id"   TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "message"   TEXT NOT NULL,
  "is_admin"  BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");
CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets"("created_at" DESC);
CREATE INDEX "support_messages_ticket_id_idx" ON "support_messages"("ticket_id");

-- ==================== EVENT HISTORY (extra metadata) ====================
-- Add import tracking columns to events table
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

CREATE INDEX "events_archived_idx" ON "events"("archived");
CREATE INDEX "events_import_source_idx" ON "events"("import_source");
CREATE INDEX "lives_archived_idx" ON "lives"("archived");
