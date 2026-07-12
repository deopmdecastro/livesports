-- The banners API route and admin frontend (subtitle, badge, CTA button text,
-- and manual sort order) were built assuming columns that were never added
-- to the "banners" table in 001_initial.sql. This caused
-- GET /api/banners to fail with a 500 (column does not exist).

ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "badge" VARCHAR(50);
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "cta_text" VARCHAR(100);
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "banners_sort_order_idx" ON "banners"("sort_order");
