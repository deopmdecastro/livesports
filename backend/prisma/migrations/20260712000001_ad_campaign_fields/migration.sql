-- campaigns.routes.ts (GET/PUT/DELETE /api/campaigns) groups ads into
-- "campaigns" using columns that were never added to the ads table in
-- 001_initial.sql, which caused GET /api/campaigns to fail with a 500.

ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "campaign_id" TEXT;
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "campaign_name" VARCHAR(200);
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "advertiser_name" VARCHAR(200);
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "budget" DECIMAL(10,2);
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "spent" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "positions" TEXT[];

CREATE INDEX IF NOT EXISTS "ads_campaign_id_idx" ON "ads"("campaign_id");
