-- Site-wide settings (branding, etc.) were only ever stored in the
-- browser's localStorage, so the footer logo (and any other browser)
-- never picked up changes made in Definições > Identidade Visual.
-- This table lets /api/settings/branding persist and serve it centrally.

CREATE TABLE IF NOT EXISTS "site_settings" (
  "key"        TEXT PRIMARY KEY,
  "value"      JSONB NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
