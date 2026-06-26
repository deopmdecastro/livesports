-- ============================================================================
-- Demo seed data for LiveSports
-- ----------------------------------------------------------------------------
-- Populates the database with realistic lives, events, ads and audience users
-- so the public site and admin dashboard render real, dynamic data instead of
-- empty states. Safe to run multiple times — every statement is idempotent
-- (fixed ids + ON CONFLICT DO NOTHING). It never touches the admin account or
-- the competitions/categories created by 001_initial.sql.
--
-- Run with:  docker exec -i livesports-pg psql -U livesports -d livesports_db < prisma/seed-demo.sql
-- ============================================================================

-- ─── Audience users (drive the "users" / "countries" stats) ─────────────────
-- Password hashes are random and unrecoverable: these accounts exist only to
-- represent platform audience and cannot be logged into.
INSERT INTO "users" (id, name, email, email_verified, password, role, status, country, created_at) VALUES
  ('demo-user-1', 'Bruno Carvalho',   'bruno.demo@livesports.local',   true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'Portugal',       NOW() - INTERVAL '40 days'),
  ('demo-user-2', 'Sofia Almeida',    'sofia.demo@livesports.local',   true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'Brasil',         NOW() - INTERVAL '35 days'),
  ('demo-user-3', 'James Wilson',     'james.demo@livesports.local',   true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'United Kingdom', NOW() - INTERVAL '30 days'),
  ('demo-user-4', 'María García',     'maria.demo@livesports.local',   true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'España',         NOW() - INTERVAL '25 days'),
  ('demo-user-5', 'Luca Romano',      'luca.demo@livesports.local',    true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'Italia',         NOW() - INTERVAL '20 days'),
  ('demo-user-6', 'Lukas Müller',     'lukas.demo@livesports.local',   true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'Deutschland',    NOW() - INTERVAL '15 days'),
  ('demo-user-7', 'Thomas Dubois',    'thomas.demo@livesports.local',  true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'France',         NOW() - INTERVAL '10 days'),
  ('demo-user-8', 'Mike Johnson',     'mike.demo@livesports.local',    true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'United States',  NOW() - INTERVAL '5 days'),
  ('demo-user-9', 'Ana Pereira',      'ana.demo@livesports.local',     true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'Portugal',       NOW() - INTERVAL '3 days'),
  ('demo-user-10','Carlos Souza',     'carlos.demo@livesports.local',  true, '$2b$12$axwRMjspp4x.SBBhXMG56OLdKy.OEwxQYFuMk6LXQ3PoFNtLvu2Ee', 'user', 'active', 'Brasil',         NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ─── Lives ──────────────────────────────────────────────────────────────────
-- Mix of live / scheduled / ended across several sports. Stream URLs are public
-- HLS test streams so the player actually plays something.
INSERT INTO "lives" (id, title, description, thumbnail, sport, league, team_a, team_b, score_a, score_b,
  stream_url, hls_url, status, featured, viewer_count, total_views, like_count, share_count, match_time, scheduled_at, started_at) VALUES
  ('demo-live-1', 'Real Madrid vs Barcelona — El Clásico', 'Clássico espanhol ao vivo, direto do Santiago Bernabéu.',
   'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80', 'football', 'La Liga', 'Real Madrid', 'Barcelona', 2, 1,
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'live', true, 18420, 54210, 3120, 540, '67''', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('demo-live-2', 'Manchester City vs Liverpool', 'Premier League — confronto pelo topo da tabela.',
   'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', 'football', 'Premier League', 'Manchester City', 'Liverpool', 1, 1,
   'https://test-streams.mux.dev/pts_shift/master.m3u8', 'https://test-streams.mux.dev/pts_shift/master.m3u8', 'live', true, 12750, 38900, 2010, 380, '52''', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '50 minutes'),
  ('demo-live-3', 'Lakers vs Celtics', 'NBA — clássico do basquetebol americano em direto.',
   'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80', 'basketball', 'NBA', 'LA Lakers', 'Boston Celtics', 88, 84,
   'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8', 'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8', 'live', false, 9340, 27100, 1480, 260, 'Q3 04:12', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '40 minutes'),
  ('demo-live-4', 'Inter vs Juventus — Derby d''Italia', 'Serie A italiana ao vivo.',
   'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80', 'football', 'Serie A', 'Inter', 'Juventus', 0, 0,
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'live', false, 7610, 19880, 990, 175, '23''', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'),
  ('demo-live-5', 'ATP Finals — Alcaraz vs Sinner', 'Ténis ao vivo — final do ATP Tour.',
   'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80', 'tennis', 'ATP Tour', 'C. Alcaraz', 'J. Sinner', 1, 0,
   'https://test-streams.mux.dev/pts_shift/master.m3u8', 'https://test-streams.mux.dev/pts_shift/master.m3u8', 'live', false, 5230, 14200, 720, 110, 'Set 2', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
  ('demo-live-6', 'UFC Fight Night — Main Card', 'UFC ao vivo, card principal.',
   'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80', 'ufc', 'UFC', 'Pereira', 'Adesanya', NULL, NULL,
   'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8', 'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8', 'live', true, 14980, 41200, 2600, 470, 'Round 2', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes'),

  ('demo-live-7', 'Bayern München vs Borussia Dortmund — Der Klassiker', 'Bundesliga — agendado.',
   'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80', 'football', 'Bundesliga', 'Bayern München', 'Borussia Dortmund', NULL, NULL,
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'scheduled', true, 0, 0, 0, 0, NULL, NOW() + INTERVAL '2 hours', NULL),
  ('demo-live-8', 'PSG vs Olympique de Marseille — Le Classique', 'Ligue 1 — agendado.',
   'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800&q=80', 'football', 'Ligue 1', 'PSG', 'Marseille', NULL, NULL,
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'scheduled', false, 0, 0, 0, 0, NULL, NOW() + INTERVAL '5 hours', NULL),
  ('demo-live-9', 'Champions League — Arsenal vs Bayern', 'UEFA Champions League — quartos de final.',
   'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80', 'football', 'UEFA Champions League', 'Arsenal', 'Bayern München', NULL, NULL,
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'scheduled', true, 0, 0, 0, 0, NULL, NOW() + INTERVAL '1 day', NULL),
  ('demo-live-10', 'F1 — Grande Prémio de Mónaco', 'Fórmula 1 ao vivo, qualificação.',
   'https://images.unsplash.com/photo-1583395838144-09c4f1d7c0f0?w=800&q=80', 'f1', 'Formula 1', 'Verstappen', 'Hamilton', NULL, NULL,
   'https://test-streams.mux.dev/pts_shift/master.m3u8', 'https://test-streams.mux.dev/pts_shift/master.m3u8', 'scheduled', false, 0, 0, 0, 0, NULL, NOW() + INTERVAL '8 hours', NULL),

  ('demo-live-11', 'Chelsea vs Tottenham — London Derby', 'Premier League — terminado.',
   'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80', 'football', 'Premier League', 'Chelsea', 'Tottenham', 3, 2,
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'ended', false, 0, 87300, 5400, 980, 'Final', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('demo-live-12', 'Atlético Madrid vs Sevilla', 'La Liga — terminado.',
   'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=80', 'football', 'La Liga', 'Atlético Madrid', 'Sevilla', 1, 0,
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'ended', false, 0, 45600, 2800, 510, 'Final', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('demo-live-13', 'Golden State Warriors vs Phoenix Suns', 'NBA — terminado.',
   'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80', 'basketball', 'NBA', 'GS Warriors', 'Phoenix Suns', 112, 108,
   'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8', 'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8', 'ended', false, 0, 33400, 1900, 340, 'Final', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ─── live_views (drive the dashboard 7-day views chart) ─────────────────────
-- Generate view rows spread across the last 7 days for the live/ended streams.
INSERT INTO "live_views" (id, live_id, client_id, user_agent, created_at)
SELECT
  'demo-view-' || g || '-' || s.id,
  s.id,
  'demo-client-' || (g % 50),
  (ARRAY[
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Desktop',
    'Mozilla/5.0 (Linux; Android 14; Tablet)',
    'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0)'
  ])[1 + (g % 4)],
  NOW() - (((g * 37) % (7 * 24)) || ' hours')::interval
FROM (VALUES
  ('demo-live-1'),('demo-live-2'),('demo-live-3'),('demo-live-6'),
  ('demo-live-11'),('demo-live-12'),('demo-live-13')
) AS s(id)
CROSS JOIN generate_series(1, 120) AS g
ON CONFLICT (id) DO NOTHING;

-- ─── Events (linked to competitions for the World Cup / competition views) ──
INSERT INTO "events" (id, title, sport, league, team_a, team_b, scheduled_at, status, competition_id, stage, thumbnail) VALUES
  ('demo-event-1', 'Real Madrid vs Manchester City', 'football', 'UEFA Champions League', 'Real Madrid', 'Manchester City', NOW() + INTERVAL '1 day',  'upcoming', 'comp-ucl', 'Semifinal', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80'),
  ('demo-event-2', 'Bayern München vs PSG',          'football', 'UEFA Champions League', 'Bayern München', 'PSG',          NOW() + INTERVAL '2 days',  'upcoming', 'comp-ucl', 'Semifinal', 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80'),
  ('demo-event-3', 'Arsenal vs Chelsea',             'football', 'Premier League',        'Arsenal', 'Chelsea',              NOW() + INTERVAL '3 days',  'upcoming', 'comp-premier-league', 'Jornada 30', 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80'),
  ('demo-event-4', 'Liverpool vs Manchester United', 'football', 'Premier League',        'Liverpool', 'Manchester United',  NOW() + INTERVAL '4 days',  'upcoming', 'comp-premier-league', 'Jornada 30', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'),
  ('demo-event-5', 'Barcelona vs Atlético Madrid',   'football', 'La Liga',               'Barcelona', 'Atlético Madrid',     NOW() + INTERVAL '2 days',  'upcoming', 'comp-la-liga', 'Jornada 28', 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=80'),
  ('demo-event-6', 'Sevilla vs Valencia',            'football', 'La Liga',               'Sevilla', 'Valencia',             NOW() + INTERVAL '5 days',  'upcoming', 'comp-la-liga', 'Jornada 28', 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80'),
  ('demo-event-7', 'Juventus vs AC Milan',           'football', 'Serie A',               'Juventus', 'AC Milan',            NOW() + INTERVAL '1 day',   'upcoming', 'comp-serie-a', 'Jornada 29', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80'),
  ('demo-event-8', 'Napoli vs Inter',                'football', 'Serie A',               'Napoli', 'Inter',                NOW() + INTERVAL '6 days',  'upcoming', 'comp-serie-a', 'Jornada 29', 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800&q=80'),
  ('demo-event-9', 'Portugal vs Brasil',             'football', 'Copa do Mundo FIFA 2026','Portugal', 'Brasil',             NOW() + INTERVAL '10 days', 'upcoming', 'comp-wc-2026', 'Grupo A', 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80'),
  ('demo-event-10','Argentina vs França',            'football', 'Copa do Mundo FIFA 2026','Argentina', 'França',             NOW() + INTERVAL '11 days', 'upcoming', 'comp-wc-2026', 'Grupo C', 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- ─── Ads (drive revenue stat + landing/admin ad slots) ──────────────────────
INSERT INTO "ads" (id, title, campaign, position, format, content, image_url, click_url, status, impressions, clicks, ctr, revenue, start_date, end_date) VALUES
  ('demo-ad-1', 'Aposta com Responsabilidade', 'BetPartner Q2', 'in_content', 'banner', 'Promoção exclusiva para novos utilizadores.',
   'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&q=80', 'https://example.com/promo', 'active', 184200, 5230, 2.84, 4820.50, CURRENT_DATE - 20, CURRENT_DATE + 40),
  ('demo-ad-2', 'Equipamento Desportivo Pro',  'SportGear',     'sidebar',    'banner', 'Material desportivo profissional com 30% de desconto.',
   'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80', 'https://example.com/gear', 'active', 96800, 2110, 2.18, 2140.00, CURRENT_DATE - 15, CURRENT_DATE + 45),
  ('demo-ad-3', 'Streaming Premium 4K',        'LiveSports+',   'live_preroll','video',  'Assiste sem anúncios em 4K. Experimenta grátis 7 dias.',
   'https://images.unsplash.com/photo-1593766788306-28561086694e?w=800&q=80', 'https://example.com/premium', 'active', 251000, 8940, 3.56, 9870.75, CURRENT_DATE - 10, CURRENT_DATE + 50)
ON CONFLICT (id) DO NOTHING;
