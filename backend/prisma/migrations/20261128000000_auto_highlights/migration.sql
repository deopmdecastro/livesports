ALTER TABLE event_highlights ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE event_highlights ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE event_highlights ADD COLUMN IF NOT EXISTS channel_name TEXT;
CREATE TABLE IF NOT EXISTS highlight_search_jobs (event_id TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE, blocked BOOLEAN NOT NULL DEFAULT false, next_check TIMESTAMPTZ, locked_until TIMESTAMPTZ, last_result TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS highlight_search_quota (day DATE PRIMARY KEY, requests INTEGER NOT NULL DEFAULT 0);
