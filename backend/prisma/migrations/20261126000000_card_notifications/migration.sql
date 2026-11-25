ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS cards BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS notification_card_state (event_id TEXT PRIMARY KEY, initialized BOOLEAN NOT NULL DEFAULT false, checked_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS notification_seen_cards (event_id TEXT NOT NULL, card_key TEXT NOT NULL, PRIMARY KEY(event_id,card_key));
