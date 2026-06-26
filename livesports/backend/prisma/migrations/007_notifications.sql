-- ==================== NOTIFICATIONS ====================

CREATE TYPE notification_type AS ENUM (
  'new_ticket',
  'ticket_reply',
  'ticket_status_change',
  'poll_milestone',
  'creator_application',
  'channel_status_change',
  'system'
);

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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON "notifications"("read");
CREATE INDEX IF NOT EXISTS idx_notifications_created ON "notifications"("created_at" DESC);
