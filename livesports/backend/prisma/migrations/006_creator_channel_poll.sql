-- ==================== CREATOR CHANNELS ====================

CREATE TYPE channel_status AS ENUM ('active', 'suspended', 'pending', 'inactive');

CREATE TABLE IF NOT EXISTS "channels" (
  "id"            TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"       TEXT         NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "name"          VARCHAR(200) NOT NULL,
  "slug"          VARCHAR(200) UNIQUE NOT NULL,
  "description"   TEXT,
  "avatar"        TEXT,
  "banner"        TEXT,
  "sport"         TEXT,
  "country"       TEXT,
  "status"        channel_status DEFAULT 'pending',
  "verified"      BOOLEAN      DEFAULT false,
  "subscriber_count" INTEGER   DEFAULT 0,
  "total_views"   INTEGER      DEFAULT 0,
  "live_count"    INTEGER      DEFAULT 0,
  "website_url"   TEXT,
  "social_links"  JSONB        DEFAULT '{}',
  "created_at"    TIMESTAMPTZ  DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_user_id ON "channels"("user_id");
CREATE INDEX IF NOT EXISTS idx_channels_status  ON "channels"("status");

-- ==================== CHANNEL SUBSCRIPTIONS ====================

CREATE TABLE IF NOT EXISTS "channel_subscriptions" (
  "id"            TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "channel_id"    TEXT         NOT NULL REFERENCES "channels"(id) ON DELETE CASCADE,
  "user_id"       TEXT         NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "created_at"    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE("channel_id","user_id")
);

-- ==================== CREATOR APPLICATIONS ====================

CREATE TYPE creator_app_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS "creator_applications" (
  "id"            TEXT              PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"       TEXT              NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "channel_name"  VARCHAR(200)      NOT NULL,
  "description"   TEXT,
  "sport"         TEXT,
  "social_links"  JSONB             DEFAULT '{}',
  "status"        creator_app_status DEFAULT 'pending',
  "admin_notes"   TEXT,
  "reviewed_by"   TEXT              REFERENCES "users"(id) ON DELETE SET NULL,
  "reviewed_at"   TIMESTAMPTZ,
  "created_at"    TIMESTAMPTZ       DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ       DEFAULT NOW()
);

-- ==================== LIVE POLLS ====================

CREATE TYPE poll_status AS ENUM ('active', 'closed', 'draft');

CREATE TABLE IF NOT EXISTS "live_polls" (
  "id"            TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "live_id"       TEXT          REFERENCES "lives"(id) ON DELETE CASCADE,
  "created_by"    TEXT          REFERENCES "users"(id) ON DELETE SET NULL,
  "question"      VARCHAR(500)  NOT NULL,
  "status"        poll_status   DEFAULT 'active',
  "duration_sec"  INTEGER       DEFAULT 60,
  "ends_at"       TIMESTAMPTZ,
  "created_at"    TIMESTAMPTZ   DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "poll_options" (
  "id"            TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "poll_id"       TEXT         NOT NULL REFERENCES "live_polls"(id) ON DELETE CASCADE,
  "label"         VARCHAR(200) NOT NULL,
  "vote_count"    INTEGER      DEFAULT 0,
  "order_index"   INTEGER      DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "poll_votes" (
  "id"            TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "poll_id"       TEXT         NOT NULL REFERENCES "live_polls"(id) ON DELETE CASCADE,
  "option_id"     TEXT         NOT NULL REFERENCES "poll_options"(id) ON DELETE CASCADE,
  "client_id"     TEXT,
  "user_id"       TEXT         REFERENCES "users"(id) ON DELETE SET NULL,
  "created_at"    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE("poll_id","client_id")
);

CREATE INDEX IF NOT EXISTS idx_polls_live_id ON "live_polls"("live_id");

-- ==================== LIVE CHAT PINS ====================

CREATE TABLE IF NOT EXISTS "live_chat_pins" (
  "id"            TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "live_id"       TEXT         NOT NULL REFERENCES "lives"(id) ON DELETE CASCADE,
  "message"       TEXT         NOT NULL,
  "pinned_by"     TEXT         REFERENCES "users"(id) ON DELETE SET NULL,
  "active"        BOOLEAN      DEFAULT true,
  "created_at"    TIMESTAMPTZ  DEFAULT NOW()
);

-- ==================== USER WATCHLIST ====================

CREATE TABLE IF NOT EXISTS "user_watchlist" (
  "id"            TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"       TEXT         NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "live_id"       TEXT         REFERENCES "lives"(id) ON DELETE CASCADE,
  "event_id"      TEXT,
  "watched_at"    TIMESTAMPTZ  DEFAULT NOW(),
  "watch_duration" INTEGER     DEFAULT 0,
  UNIQUE("user_id","live_id")
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON "user_watchlist"("user_id");

-- Add creator_role to users if not already
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum WHERE enumlabel = 'creator' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'creator';
  END IF;
END $$;
