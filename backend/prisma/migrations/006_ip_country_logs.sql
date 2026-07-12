-- =====================================================
-- LiveSports Migration 006 - IP Country for Logs
-- =====================================================
ALTER TABLE "system_logs" ADD COLUMN IF NOT EXISTS "ip_country" TEXT;
CREATE INDEX IF NOT EXISTS "system_logs_ip_country_idx" ON "system_logs"("ip_country");
