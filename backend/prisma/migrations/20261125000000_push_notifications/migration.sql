CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id);
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  announcements BOOLEAN NOT NULL DEFAULT true, goals BOOLEAN NOT NULL DEFAULT true,
  match_start BOOLEAN NOT NULL DEFAULT true, daily BOOLEAN NOT NULL DEFAULT false,
  event_ids JSONB NOT NULL DEFAULT '[]', updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notification_event_state (
  event_id TEXT PRIMARY KEY, status TEXT NOT NULL, score_a INTEGER, score_b INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notification_daily_log (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, day DATE NOT NULL,
  PRIMARY KEY (user_id, day)
);
