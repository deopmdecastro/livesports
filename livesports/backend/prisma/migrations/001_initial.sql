-- =====================================================
-- LiveSports Database - Migration 001 - Initial Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================
CREATE TYPE "user_role" AS ENUM ('super_admin', 'admin', 'moderator', 'editor', 'user');
CREATE TYPE "user_status" AS ENUM ('active', 'suspended', 'banned', 'pending');
CREATE TYPE "live_status" AS ENUM ('scheduled', 'live', 'ended', 'cancelled');
CREATE TYPE "event_status" AS ENUM ('upcoming', 'live', 'finished', 'cancelled');
CREATE TYPE "sport_category" AS ENUM ('football', 'basketball', 'tennis', 'ufc', 'f1', 'volleyball', 'baseball', 'other');
CREATE TYPE "ad_position" AS ENUM ('header', 'sidebar', 'footer', 'in_content', 'player', 'popup', 'live_preroll');
CREATE TYPE "ad_format" AS ENUM ('banner', 'video', 'html', 'script');
CREATE TYPE "ad_status" AS ENUM ('active', 'paused', 'expired', 'draft');
CREATE TYPE "plan_type" AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE "billing_interval" AS ENUM ('monthly', 'yearly');
CREATE TYPE "subscription_status" AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE "notification_type" AS ENUM ('info', 'success', 'warning', 'error', 'live');
CREATE TYPE "banner_position" AS ENUM ('hero', 'sidebar', 'in_content');

-- ==================== USERS ====================
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "email_verified_at" TIMESTAMPTZ,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "country" VARCHAR(100),
    "phone" VARCHAR(20),
    "role" "user_role" NOT NULL DEFAULT 'user',
    "status" "user_status" NOT NULL DEFAULT 'active',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "two_factor_secret" TEXT,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_unique" UNIQUE ("email")
);

CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE INDEX "users_created_at_idx" ON "users"("created_at" DESC);

-- ==================== REFRESH TOKENS ====================
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token"),
    CONSTRAINT "refresh_tokens_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- ==================== LIVES ====================
CREATE TABLE "lives" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "banner" TEXT,
    "sport" "sport_category" NOT NULL,
    "league" VARCHAR(200),
    "team_a" VARCHAR(200),
    "team_a_logo" TEXT,
    "team_b" VARCHAR(200),
    "team_b_logo" TEXT,
    "score_a" INTEGER,
    "score_b" INTEGER,
    "stream_url" TEXT,
    "hls_url" TEXT,
    "m3u8_url" TEXT,
    "status" "live_status" NOT NULL DEFAULT 'scheduled',
    "featured" BOOLEAN NOT NULL DEFAULT FALSE,
    "viewer_count" INTEGER NOT NULL DEFAULT 0,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "match_time" VARCHAR(20),
    "tags" TEXT[] DEFAULT '{}',
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "started_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "lives_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lives_status_idx" ON "lives"("status");
CREATE INDEX "lives_sport_idx" ON "lives"("sport");
CREATE INDEX "lives_featured_idx" ON "lives"("featured");
CREATE INDEX "lives_scheduled_at_idx" ON "lives"("scheduled_at");

-- ==================== EVENTS ====================
CREATE TABLE "events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "sport" "sport_category" NOT NULL,
    "league" VARCHAR(200),
    "team_a" VARCHAR(200),
    "team_a_logo" TEXT,
    "team_b" VARCHAR(200),
    "team_b_logo" TEXT,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "status" "event_status" NOT NULL DEFAULT 'upcoming',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "events_status_idx" ON "events"("status");
CREATE INDEX "events_sport_idx" ON "events"("sport");
CREATE INDEX "events_scheduled_at_idx" ON "events"("scheduled_at");

-- ==================== CATEGORIES ====================
CREATE TABLE "categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sport" "sport_category" NOT NULL,
    "color" VARCHAR(7),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_name_unique" UNIQUE ("name"),
    CONSTRAINT "categories_slug_unique" UNIQUE ("slug")
);

-- ==================== ADS ====================
CREATE TABLE "ads" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" VARCHAR(200) NOT NULL,
    "campaign" VARCHAR(200),
    "position" "ad_position" NOT NULL,
    "format" "ad_format" NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "video_url" TEXT,
    "click_url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "ad_status" NOT NULL DEFAULT 'active',
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ads_status_idx" ON "ads"("status");
CREATE INDEX "ads_position_idx" ON "ads"("position");

-- ==================== NEWS ====================
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(500) NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "thumbnail" TEXT,
    "sport" "sport_category",
    "tags" TEXT[] DEFAULT '{}',
    "author_id" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT FALSE,
    "featured" BOOLEAN NOT NULL DEFAULT FALSE,
    "views" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMPTZ,
    "meta_title" VARCHAR(200),
    "meta_desc" VARCHAR(400),
    "og_image" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "news_articles_slug_unique" UNIQUE ("slug"),
    CONSTRAINT "news_articles_author_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id")
);

CREATE INDEX "news_published_idx" ON "news_articles"("published");
CREATE INDEX "news_slug_idx" ON "news_articles"("slug");

-- ==================== PLANS & SUBSCRIPTIONS ====================
CREATE TABLE "plans" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" VARCHAR(100) NOT NULL,
    "type" "plan_type" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "interval" "billing_interval" NOT NULL,
    "features" TEXT[] DEFAULT '{}',
    "max_devices" INTEGER NOT NULL DEFAULT 1,
    "hd_quality" BOOLEAN NOT NULL DEFAULT FALSE,
    "ads_removed" BOOLEAN NOT NULL DEFAULT FALSE,
    "active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscriptions_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    CONSTRAINT "subscriptions_plan_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id")
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "notification_type" NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT FALSE,
    "action_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notifications_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- ==================== BANNERS ====================
CREATE TABLE "banners" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" VARCHAR(200) NOT NULL,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "position" "banner_position" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT TRUE,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- ==================== AUDIT LOGS ====================
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "user_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" TEXT,
    "details" JSONB,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- ==================== SEED DATA ====================
-- Insert admin user (password: admin123)
INSERT INTO "users" ("id", "name", "email", "email_verified", "password", "role", "status")
VALUES ('admin-001', 'Administrador', 'admin@livesports.com', TRUE, '$2b$12$otiPj3ww0AR63raJnI37lu5u.16OpyB74o7WtCu.HrwCDFZC.3EJO', 'super_admin', 'active');

-- Insert plans
INSERT INTO "plans" ("name", "type", "price", "interval", "features", "max_devices", "hd_quality", "ads_removed") VALUES
('Grátis', 'free', 0, 'monthly', ARRAY['Acesso limitado','Qualidade SD','1 dispositivo'], 1, FALSE, FALSE),
('Básico', 'basic', 19.90, 'monthly', ARRAY['Acesso completo','Qualidade HD','2 dispositivos','Sem anúncios'], 2, TRUE, TRUE),
('Premium', 'premium', 39.90, 'monthly', ARRAY['Acesso completo','Qualidade Full HD','4 dispositivos','Sem anúncios','Download offline'], 4, TRUE, TRUE),
('Anual Premium', 'premium', 299.90, 'yearly', ARRAY['Tudo do Premium','Economia de 37%','Suporte prioritário'], 4, TRUE, TRUE);

-- Insert categories
INSERT INTO "categories" ("name", "slug", "sport", "color") VALUES
('Premier League', 'premier-league', 'football', '#3D195B'),
('La Liga', 'la-liga', 'football', '#FF4B44'),
('UEFA Champions League', 'champions-league', 'football', '#1B3C7B'),
('NBA', 'nba', 'basketball', '#C9082A'),
('ATP Tour', 'atp-tour', 'tennis', '#6AC241'),
('UFC', 'ufc', 'ufc', '#D20A0A'),
('Formula 1', 'formula-1', 'f1', '#E10600');
