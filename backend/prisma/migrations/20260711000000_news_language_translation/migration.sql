-- News language + auto-translation support.
-- language: 'pt' | 'en' | NULL (unknown, e.g. manually created articles before this migration)
-- translation_of_id: self-reference — set on the auto-generated PT/EN sibling created during import

ALTER TABLE "news_articles" ADD COLUMN IF NOT EXISTS "language" TEXT;
ALTER TABLE "news_articles" ADD COLUMN IF NOT EXISTS "translation_of_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'news_articles_translation_of_id_fkey'
  ) THEN
    ALTER TABLE "news_articles"
      ADD CONSTRAINT "news_articles_translation_of_id_fkey"
      FOREIGN KEY ("translation_of_id") REFERENCES "news_articles"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "news_articles_translation_of_id_idx" ON "news_articles"("translation_of_id");
