-- ==================== NOTIFICATIONS ====================
-- 001_initial.sql already creates "notification_type" (a 5-value enum) and
-- a "notifications" table before this file runs. This used to CREATE TYPE
-- notification_type again unconditionally, which fails hard (Postgres has
-- no "CREATE TYPE ... IF NOT EXISTS") and aborted every init script that
-- ran after this one. It also relied on CREATE TABLE IF NOT EXISTS, which
-- silently no-ops against 001's table even though that table is missing
-- columns (link, meta, read_at) the notifications API actually needs, and
-- has "message" as NOT NULL even though the API can insert a null message.
-- This version extends whatever 001_initial.sql already created instead of
-- assuming a clean slate.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'live');
  END IF;
END $$;

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_ticket';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_reply';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_status_change';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'poll_milestone';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'creator_application';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'channel_status_change';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'system';

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"          TEXT               PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"     TEXT               REFERENCES "users"(id) ON DELETE CASCADE,
  "type"        notification_type  NOT NULL,
  "title"       VARCHAR(300)       NOT NULL,
  "message"     TEXT,
  "link"        TEXT,
  "meta"        JSONB              DEFAULT '{}',
  "read"        BOOLEAN            DEFAULT false,
  "read_at"     TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ        DEFAULT NOW()
);

-- If 001_initial.sql already created the table, add whatever it's missing.
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "link" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "meta" JSONB DEFAULT '{}';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMPTZ;
ALTER TABLE "notifications" ALTER COLUMN "message" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON "notifications"("read");
CREATE INDEX IF NOT EXISTS idx_notifications_created ON "notifications"("created_at" DESC);
