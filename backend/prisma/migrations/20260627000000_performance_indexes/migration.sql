-- Performance Indexes Migration
-- Adds indexes for common query patterns to improve performance

CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "lives_status_idx" ON "lives"("status");
CREATE INDEX IF NOT EXISTS "lives_sport_idx" ON "lives"("sport");
CREATE INDEX IF NOT EXISTS "lives_scheduled_at_idx" ON "lives"("scheduled_at" DESC);
CREATE INDEX IF NOT EXISTS "events_scheduled_idx" ON "events"("scheduled_at" DESC);
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events"("status");
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "api_keys_provider_idx" ON "api_keys"("provider");
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "subscriptions_user_status_idx" ON "subscriptions"("user_id", "status");
CREATE INDEX IF NOT EXISTS "ads_position_status_idx" ON "ads"("position", "status");
CREATE INDEX IF NOT EXISTS "live_comments_live_created_idx" ON "live_comments"("live_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "live_views_live_created_idx" ON "live_views"("live_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "news_published_sport_idx" ON "news_articles"("published", "sport");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX IF NOT EXISTS "support_tickets_user_idx" ON "support_tickets"("user_id");
CREATE INDEX IF NOT EXISTS "system_logs_created_idx" ON "system_logs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "system_logs_level_service_idx" ON "system_logs"("level", "service");
