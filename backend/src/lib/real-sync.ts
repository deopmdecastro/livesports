import { prisma } from './prisma';
import {
  fetchEspnScoreboardEvents,
  fetchRealSportsNews,
  REAL_HLS_CHANNELS,
  type RealSportEvent,
} from './real-sports-feed';
import { fetchEventsByDay } from './thesportsdb';

let lastSyncAt = 0;
const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 min cooldown for auto-sync

// ─── Rich SVG Data URI Banners & Ad Creatives ──────────────────────────────
// Embedded vector SVG banners guarantee crisp 4K rendering with zero broken links
// even inside strict sandboxed previews or offline Docker containers.

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

const AD_CREATIVES = {
  header: svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 90" width="1100" height="90">
      <defs>
        <linearGradient id="bgH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#070912"/>
          <stop offset="48%" stop-color="#190812"/>
          <stop offset="100%" stop-color="#0B0F1E"/>
        </linearGradient>
        <linearGradient id="redBtn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF2330"/>
          <stop offset="100%" stop-color="#B8050E"/>
        </linearGradient>
      </defs>
      <rect width="1100" height="90" rx="14" fill="url(#bgH)"/>
      <circle cx="170" cy="45" r="130" fill="#E50914" opacity="0.14"/>
      <circle cx="920" cy="45" r="110" fill="#FFD700" opacity="0.08"/>
      <rect x="24" y="20" width="94" height="24" rx="12" fill="#E50914" opacity="0.22" stroke="#E50914" stroke-opacity="0.5"/>
      <circle cx="38" cy="32" r="4" fill="#FF4D57"/>
      <text x="48" y="36" fill="#FF858D" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" letter-spacing="1.2">OFERTA PRO</text>
      <text x="24" y="68" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900">LIVESPORTS+ ULTRA 4K · SEM ANÚNCIOS</text>
      <text x="465" y="42" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600">Multi-câmara em direto · Champions League, NBA, UFC &amp; F1</text>
      <text x="465" y="64" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="12">Experimenta 7 dias grátis · Cancela quando quiseres</text>
      <rect x="895" y="23" width="180" height="44" rx="22" fill="url(#redBtn)"/>
      <text x="985" y="50" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="0.6">ATIVAR 7 DIAS →</text>
    </svg>
  `),
  in_content: svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 90" width="1100" height="90">
      <defs>
        <linearGradient id="bgIn" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#06121C"/>
          <stop offset="55%" stop-color="#0C2233"/>
          <stop offset="100%" stop-color="#07111A"/>
        </linearGradient>
        <linearGradient id="goldCta" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFD700"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
      </defs>
      <rect width="1100" height="90" rx="14" fill="url(#bgIn)"/>
      <circle cx="840" cy="45" r="140" fill="#10B981" opacity="0.12"/>
      <rect x="24" y="18" width="128" height="22" rx="11" fill="#10B981" opacity="0.18"/>
      <text x="36" y="33" fill="#34D399" font-family="system-ui, sans-serif" font-size="10" font-weight="800" letter-spacing="1.2">PARCEIRO OFICIAL</text>
      <text x="24" y="66" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="22" font-weight="900">BETANO SPORTPULSE · ODDS EM TEMPO REAL</text>
      <text x="515" y="42" fill="#CBD5E1" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Estatísticas oficiais + Bónus de Boas-Vindas até 100€</text>
      <text x="515" y="63" fill="#64748B" font-family="system-ui, sans-serif" font-size="11">+18 · Jogue com responsabilidade · Licença SRIJ Portugal</text>
      <rect x="895" y="23" width="180" height="44" rx="22" fill="url(#goldCta)"/>
      <text x="985" y="50" text-anchor="middle" fill="#0A0A0F" font-family="system-ui, sans-serif" font-size="13" font-weight="900" letter-spacing="0.5">VER SUPER ODDS</text>
    </svg>
  `),
  sidebar: svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <defs>
        <linearGradient id="bgSide" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#14070B"/>
          <stop offset="50%" stop-color="#0C0E18"/>
          <stop offset="100%" stop-color="#1C0910"/>
        </linearGradient>
      </defs>
      <rect width="640" height="480" rx="24" fill="url(#bgSide)"/>
      <circle cx="520" cy="90" r="180" fill="#E50914" opacity="0.22"/>
      <circle cx="110" cy="400" r="150" fill="#3B82F6" opacity="0.12"/>
      <rect x="44" y="42" width="156" height="32" rx="16" fill="#E50914" opacity="0.2" stroke="#E50914" stroke-opacity="0.45"/>
      <text x="122" y="63" text-anchor="middle" fill="#FF6B74" font-family="system-ui, sans-serif" font-size="13" font-weight="800" letter-spacing="1.5">STORE OFICIAL</text>
      <text x="44" y="136" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="44" font-weight="900">CAMISOLAS</text>
      <text x="44" y="186" fill="#E50914" font-family="system-ui, sans-serif" font-size="44" font-weight="900">ÉPOCA 26/27</text>
      <text x="44" y="236" fill="#CBD5E1" font-family="system-ui, sans-serif" font-size="20" font-weight="500">Seleções, Champions League &amp; NBA</text>
      <text x="44" y="268" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="18">Personalização oficial · Entrega 24h</text>
      <rect x="44" y="302" width="160" height="44" rx="12" fill="#FFFFFF" opacity="0.08"/>
      <text x="124" y="330" text-anchor="middle" fill="#FACC15" font-family="system-ui, sans-serif" font-size="20" font-weight="900">-30% HOJE</text>
      <rect x="44" y="378" width="552" height="62" rx="31" fill="#E50914"/>
      <text x="320" y="417" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="20" font-weight="800" letter-spacing="1">COMPRAR EQUIPAMENTO →</text>
    </svg>
  `),
  footer: svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 90" width="1100" height="90">
      <defs>
        <linearGradient id="bgFoot" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0B0D17"/>
          <stop offset="50%" stop-color="#15192B"/>
          <stop offset="100%" stop-color="#090B12"/>
        </linearGradient>
      </defs>
      <rect width="1100" height="90" rx="14" fill="url(#bgFoot)"/>
      <circle cx="220" cy="45" r="120" fill="#6366F1" opacity="0.16"/>
      <text x="28" y="38" fill="#818CF8" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1.6">APP LIVESPORTS MOBILE &amp; SMART TV</text>
      <text x="28" y="66" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="21" font-weight="900">Leva o estádio contigo · Alertas de Golo instantâneos &amp; Chromecast</text>
      <rect x="875" y="23" width="195" height="44" rx="22" fill="#4F46E5"/>
      <text x="972" y="50" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="800" letter-spacing="0.6">EXPLORAR PLANOS →</text>
    </svg>
  `),
  popup: svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
      <defs>
        <linearGradient id="bgPop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1A060B"/>
          <stop offset="100%" stop-color="#090B14"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#bgPop)"/>
      <circle cx="480" cy="70" r="150" fill="#FFD700" opacity="0.16"/>
      <circle cx="90" cy="330" r="130" fill="#E50914" opacity="0.22"/>
      <rect x="36" y="34" width="174" height="30" rx="15" fill="#FFD700" opacity="0.18"/>
      <text x="123" y="54" text-anchor="middle" fill="#FDE047" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="1.2">COPA DO MUNDO 2026</text>
      <text x="36" y="122" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="38" font-weight="900">PASSE VIP</text>
      <text x="36" y="168" fill="#FFD700" font-family="system-ui, sans-serif" font-size="38" font-weight="900">MUNDIAL 2026</text>
      <text x="36" y="216" fill="#CBD5E1" font-family="system-ui, sans-serif" font-size="18">Todos os 104 jogos em Full HD, multi-áudio</text>
      <text x="36" y="244" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="17">e estatísticas oficiais em tempo real.</text>
      <rect x="36" y="294" width="528" height="62" rx="31" fill="#E50914"/>
      <text x="300" y="332" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="19" font-weight="800" letter-spacing="0.8">ACOMPANHAR COPA DO MUNDO →</text>
    </svg>
  `),
  live_preroll: svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        <linearGradient id="bgPre" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#07080F"/>
          <stop offset="50%" stop-color="#19070D"/>
          <stop offset="100%" stop-color="#060812"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bgPre)"/>
      <circle cx="1020" cy="180" r="280" fill="#E50914" opacity="0.2"/>
      <circle cx="240" cy="580" r="260" fill="#F59E0B" opacity="0.1"/>
      <rect x="110" y="120" width="240" height="44" rx="22" fill="#E50914" opacity="0.22" stroke="#E50914" stroke-opacity="0.5"/>
      <text x="230" y="149" text-anchor="middle" fill="#FF757E" font-family="system-ui, sans-serif" font-size="18" font-weight="800" letter-spacing="2">PATROCINADOR OFICIAL</text>
      <text x="110" y="268" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="76" font-weight="900">HEINEKEN® 0.0</text>
      <text x="110" y="352" fill="#22C55E" font-family="system-ui, sans-serif" font-size="54" font-weight="900">NOITES DE CHAMPIONS EM 4K</text>
      <text x="110" y="424" fill="#CBD5E1" font-family="system-ui, sans-serif" font-size="28">Brinda a cada grande golo com transmissão sem interrupções na LiveSports.</text>
      <rect x="110" y="492" width="410" height="78" rx="39" fill="#E50914"/>
      <text x="315" y="541" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="24" font-weight="800" letter-spacing="1">CONHECER PARCEIROS →</text>
    </svg>
  `),
};

async function upsertEvent(ev: RealSportEvent) {
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "events" (
        "id", "title", "description", "thumbnail", "sport", "competition_id",
        "stage", "league", "league_logo", "team_a", "team_a_code", "team_a_logo",
        "team_b", "team_b_code", "team_b_logo", "score_a", "score_b",
        "match_time", "viewer_count", "venue", "scheduled_at", "status", "import_source", "import_date"
      )
      VALUES (
        $1, $2, $3, $4, $5::sport_category,
        (SELECT id FROM "competitions" WHERE id = $6 LIMIT 1),
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21::timestamptz, $22::event_status, 'espn-live', NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "description" = EXCLUDED."description",
        "thumbnail" = COALESCE(EXCLUDED."thumbnail", "events"."thumbnail"),
        "league" = EXCLUDED."league",
        "league_logo" = COALESCE(EXCLUDED."league_logo", "events"."league_logo"),
        "team_a" = EXCLUDED."team_a",
        "team_a_code" = COALESCE(EXCLUDED."team_a_code", "events"."team_a_code"),
        "team_a_logo" = COALESCE(EXCLUDED."team_a_logo", "events"."team_a_logo"),
        "team_b" = EXCLUDED."team_b",
        "team_b_code" = COALESCE(EXCLUDED."team_b_code", "events"."team_b_code"),
        "team_b_logo" = COALESCE(EXCLUDED."team_b_logo", "events"."team_b_logo"),
        "score_a" = EXCLUDED."score_a",
        "score_b" = EXCLUDED."score_b",
        "match_time" = EXCLUDED."match_time",
        "viewer_count" = EXCLUDED."viewer_count",
        "venue" = COALESCE(EXCLUDED."venue", "events"."venue"),
        "scheduled_at" = EXCLUDED."scheduled_at",
        "status" = EXCLUDED."status",
        "updated_at" = NOW()
    `,
    ev.id,
    ev.title,
    ev.description,
    ev.thumbnail,
    ev.sport,
    ev.competitionId,
    ev.stage,
    ev.league,
    ev.leagueLogo,
    ev.teamA,
    ev.teamACode,
    ev.teamALogo,
    ev.teamB,
    ev.teamBCode,
    ev.teamBLogo,
    ev.scoreA,
    ev.scoreB,
    ev.matchTime,
    ev.viewerCount,
    ev.venue,
    ev.scheduledAt,
    ev.status,
  );
}

async function syncRealEventsAndLives() {
  const espnEvents = await fetchEspnScoreboardEvents();

  // Also pull today's TheSportsDB soccer calendar as extra real coverage
  const today = new Date().toISOString().slice(0, 10);
  let sportsDbEvents: RealSportEvent[] = [];
  try {
    const calendar = await fetchEventsByDay({ date: today, sport: 'Soccer' });
    sportsDbEvents = calendar.slice(0, 15).map((c) => ({
      id: c.id,
      externalId: c.externalId,
      title: c.title,
      description: `${c.league}${c.venue ? ` · ${c.venue}` : ''} — Calendário oficial TheSportsDB.`,
      thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80',
      sport: c.sportCategory,
      competitionId: null,
      stage: c.round ? `Jornada ${c.round}` : 'Fase Regular',
      league: c.league,
      leagueLogo: c.leagueBadge,
      teamA: c.homeTeam,
      teamACode: null,
      teamALogo: c.homeBadge,
      teamB: c.awayTeam,
      teamBCode: null,
      teamBLogo: c.awayBadge,
      scoreA: c.homeScore,
      scoreB: c.awayScore,
      matchTime: c.matchTime.slice(0, 20),
      venue: c.venue,
      scheduledAt: c.timestamp || `${c.date}T19:00:00Z`,
      status: c.status,
      viewerCount: c.status === 'live' ? 8400 : 0,
    }));
  } catch {
    // Non-critical if rate-limited
  }

  const allRealEvents = [...espnEvents, ...sportsDbEvents];
  let syncedEvents = 0;

  for (const ev of allRealEvents) {
    try {
      await upsertEvent(ev);
      syncedEvents++;
    } catch {
      // ignore individual row errors
    }
  }

  // Upgrade existing demo lives so none of them use dead stream URLs, and add real official crests
  const fifaPtStream = REAL_HLS_CHANNELS.football[0].url;
  const fifaEnStream = REAL_HLS_CHANNELS.football[1].url;
  const redBullStream = REAL_HLS_CHANNELS.f1[0].url;
  const gloryCombatStream = REAL_HLS_CHANNELS.ufc[0].url;
  const accBasketballStream = REAL_HLS_CHANNELS.basketball[0].url;
  const africaSportStream = REAL_HLS_CHANNELS.tennis[0].url;

  // Fix dead Akamai stream in demo lives and attach multi-server real HLS streams + real club badges
  const liveUpgrades = [
    {
      id: 'demo-live-1',
      teamALogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
      teamBLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
      leagueLogo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
      banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=85',
      url: fifaPtStream,
      servers: REAL_HLS_CHANNELS.football,
    },
    {
      id: 'demo-live-2',
      teamALogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
      teamBLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
      leagueLogo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
      banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=85',
      url: fifaEnStream,
      servers: REAL_HLS_CHANNELS.football,
    },
    {
      id: 'demo-live-3',
      teamALogo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
      teamBLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
      leagueLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
      banner: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&q=85',
      url: accBasketballStream,
      servers: REAL_HLS_CHANNELS.basketball,
    },
    {
      id: 'demo-live-4',
      teamALogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
      teamBLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
      leagueLogo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
      banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1920&q=85',
      url: REAL_HLS_CHANNELS.football[2].url,
      servers: REAL_HLS_CHANNELS.football,
    },
    {
      id: 'demo-live-5',
      teamALogo: 'https://flagcdn.com/w80/es.png',
      teamBLogo: 'https://flagcdn.com/w80/it.png',
      leagueLogo: 'https://upload.wikimedia.org/wikipedia/en/3/3f/ATP_Tour_logo.svg',
      banner: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=85',
      url: africaSportStream,
      servers: REAL_HLS_CHANNELS.tennis,
    },
    {
      id: 'demo-live-6',
      teamALogo: 'https://flagcdn.com/w80/br.png',
      teamBLogo: 'https://flagcdn.com/w80/ng.png',
      leagueLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
      banner: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=1920&q=85',
      url: gloryCombatStream,
      servers: REAL_HLS_CHANNELS.ufc,
    },
    {
      id: 'demo-live-10',
      teamALogo: 'https://flagcdn.com/w80/nl.png',
      teamBLogo: 'https://flagcdn.com/w80/gb.png',
      leagueLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png',
      banner: 'https://images.unsplash.com/photo-1583395838144-09c4f1d7c0f0?w=1920&q=85',
      url: redBullStream,
      servers: REAL_HLS_CHANNELS.f1,
    },
  ];

  for (const up of liveUpgrades) {
    await prisma.$executeRawUnsafe(
      `
        UPDATE "lives"
        SET "stream_url" = $2,
            "hls_url" = $2,
            "m3u8_url" = $2,
            "team_a_logo" = COALESCE("team_a_logo", $3),
            "team_b_logo" = COALESCE("team_b_logo", $4),
            "league_logo" = COALESCE("league_logo", $5),
            "banner" = COALESCE("banner", $6),
            "stream_servers" = $7::jsonb,
            "updated_at" = NOW()
        WHERE "id" = $1
      `,
      up.id,
      up.url,
      up.teamALogo,
      up.teamBLogo,
      up.leagueLogo,
      up.banner,
      JSON.stringify(up.servers.map((s, idx) => ({ id: `srv-${idx + 1}`, name: s.name, url: s.url, quality: s.quality, latency: s.latency }))),
    ).catch(() => {});
  }

  // Also create real live/scheduled stream rooms directly from top real ESPN matches today!
  const topEspnMatches = espnEvents
    .filter((e) => e.status === 'live' || e.status === 'upcoming')
    .slice(0, 10);

  let syncedLives = 0;
  for (let i = 0; i < topEspnMatches.length; i++) {
    const m = topEspnMatches[i];
    const channels = REAL_HLS_CHANNELS[m.sport] || REAL_HLS_CHANNELS.other;
    const primary = channels[i % channels.length];
    const liveStatus = m.status === 'live' ? 'live' : 'scheduled';
    const liveId = `real-live-${m.externalId}`;
    const serversJson = JSON.stringify(
      channels.map((ch, idx) => ({
        id: `real-srv-${idx + 1}`,
        name: ch.name,
        url: ch.url,
        quality: ch.quality,
        latency: ch.latency,
      })),
    );

    try {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO "lives" (
            "id", "title", "description", "thumbnail", "banner", "sport",
            "league", "league_logo", "team_a", "team_a_logo", "team_b", "team_b_logo",
            "score_a", "score_b", "stream_url", "hls_url", "m3u8_url", "stream_servers",
            "status", "featured", "viewer_count", "total_views", "like_count", "share_count",
            "match_time", "scheduled_at", "started_at", "import_source", "import_date"
          )
          VALUES (
            $1, $2, $3, $4, $4, $5::sport_category,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $14, $14, $15::jsonb,
            $16::live_status, $17, $18, $19, $20, $21,
            $22, $23::timestamptz, $24::timestamptz, 'espn+hls', NOW()
          )
          ON CONFLICT ("id") DO UPDATE SET
            "score_a" = EXCLUDED."score_a",
            "score_b" = EXCLUDED."score_b",
            "status" = EXCLUDED."status",
            "match_time" = EXCLUDED."match_time",
            "viewer_count" = EXCLUDED."viewer_count",
            "stream_url" = EXCLUDED."stream_url",
            "hls_url" = EXCLUDED."hls_url",
            "m3u8_url" = EXCLUDED."m3u8_url",
            "stream_servers" = EXCLUDED."stream_servers",
            "updated_at" = NOW()
        `,
        liveId,
        m.title,
        m.description,
        m.thumbnail,
        m.sport,
        m.league,
        m.leagueLogo,
        m.teamA,
        m.teamALogo,
        m.teamB,
        m.teamBLogo,
        m.scoreA,
        m.scoreB,
        primary.url,
        serversJson,
        liveStatus,
        i < 4, // feature top 4
        m.status === 'live' ? m.viewerCount : 0,
        m.status === 'live' ? m.viewerCount * 3 : 1250 + i * 420,
        m.status === 'live' ? 680 + i * 110 : 95 + i * 25,
        m.status === 'live' ? 140 + i * 20 : 18 + i * 5,
        m.matchTime,
        m.scheduledAt,
        m.status === 'live' ? m.scheduledAt : null,
      );
      syncedLives++;
    } catch {
      // ignore individual failure
    }
  }

  return { syncedEvents, syncedLives };
}

async function syncRealNewsArticles() {
  const adminRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "users" WHERE role IN ('super_admin', 'admin', 'editor') ORDER BY created_at ASC LIMIT 1`,
  );
  const authorId = adminRows[0]?.id;
  if (!authorId) return 0;

  const articles = await fetchRealSportsNews({ language: 'pt,en' });
  const selected = [
    ...articles.filter((a) => a.language === 'pt').slice(0, 10),
    ...articles.filter((a) => a.language === 'en').slice(0, 8),
  ];

  let count = 0;
  for (let i = 0; i < selected.length; i++) {
    const a = selected[i];
    const views = 1420 + ((i * 733) % 9800);
    try {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO "news_articles" (
            "id", "title", "slug", "excerpt", "content", "thumbnail",
            "sport", "tags", "author_id", "published", "featured",
            "views", "published_at", "meta_title", "meta_desc", "og_image", "language"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7::sport_category, $8, $9, TRUE, $10,
            $11, $12::timestamptz, $13, $14, $6, $15
          )
          ON CONFLICT ("slug") DO UPDATE SET
            "title" = EXCLUDED."title",
            "excerpt" = EXCLUDED."excerpt",
            "content" = EXCLUDED."content",
            "thumbnail" = COALESCE(EXCLUDED."thumbnail", "news_articles"."thumbnail"),
            "published" = TRUE,
            "updated_at" = NOW()
        `,
        a.id,
        a.title.slice(0, 480),
        a.slug.slice(0, 480),
        a.excerpt,
        a.content,
        a.thumbnail,
        a.sport,
        a.tags,
        authorId,
        i < 4, // top 4 featured
        views,
        a.publishedAt,
        a.title.slice(0, 195),
        a.excerpt.slice(0, 390),
        a.language,
      );
      count++;
    } catch {
      // ignore duplicate ID collision
    }
  }

  return count;
}

async function syncAdvertisingAndBanners() {
  const adsSeed = [
    {
      id: 'ad-pro-header-1',
      title: 'LiveSports+ Ultra 4K — Experimenta 7 Dias Grátis',
      campaign: 'LiveSports+ Q4 2026',
      advertiser: 'LiveSports Media',
      position: 'header',
      format: 'banner',
      content: 'Streaming desportivo 4K sem anúncios, multi-câmara e alertas em tempo real.',
      imageUrl: AD_CREATIVES.header,
      clickUrl: '/plans',
      impressions: 312450,
      clicks: 11240,
      ctr: 3.6,
      revenue: 6420.0,
    },
    {
      id: 'ad-betano-incontent-1',
      title: 'Betano SportPulse — Super Odds & Estatísticas em Tempo Real',
      campaign: 'Partner Sportsbook 2026',
      advertiser: 'Betano Portugal',
      position: 'in_content',
      format: 'banner',
      content: 'Estatísticas ao segundo e mercados especiais nos jogos da Liga dos Campeões e Liga Portugal.',
      imageUrl: AD_CREATIVES.in_content,
      clickUrl: '/calendario',
      impressions: 248900,
      clicks: 8960,
      ctr: 3.6,
      revenue: 5890.5,
    },
    {
      id: 'ad-store-sidebar-1',
      title: 'Store Oficial Época 2026/27 — 30% Desconto Hoje',
      campaign: 'Kit Launch 26/27',
      advertiser: 'ProKit Store',
      position: 'sidebar',
      format: 'banner',
      content: 'Camisolas oficiais das principais ligas europeias, seleções e NBA com entrega 24h.',
      imageUrl: AD_CREATIVES.sidebar,
      clickUrl: '/competicao',
      impressions: 164300,
      clicks: 4920,
      ctr: 2.99,
      revenue: 3410.0,
    },
    {
      id: 'ad-mobile-footer-1',
      title: 'App LiveSports Mobile & Smart TV — Alertas de Golo',
      campaign: 'App Ecosystem 2026',
      advertiser: 'LiveSports',
      position: 'footer',
      format: 'banner',
      content: 'Recebe alertas instantâneos e transmite para a tua TV via AirPlay ou Chromecast.',
      imageUrl: AD_CREATIVES.footer,
      clickUrl: '/plans',
      impressions: 198400,
      clicks: 5410,
      ctr: 2.73,
      revenue: 2950.0,
    },
    {
      id: 'ad-wc2026-popup-1',
      title: 'Passe VIP Copa do Mundo FIFA 2026',
      campaign: 'World Cup 2026 Countdown',
      advertiser: 'LiveSports Pass',
      position: 'popup',
      format: 'banner',
      content: '104 jogos em direto, grupos, calendário completo e multi-servidor.',
      imageUrl: AD_CREATIVES.popup,
      clickUrl: '/copa-do-mundo',
      impressions: 92400,
      clicks: 3890,
      ctr: 4.21,
      revenue: 4120.0,
    },
    {
      id: 'ad-heineken-preroll-1',
      title: 'Noites Europeias em 4K — Patrocinador Oficial das Transmissões',
      campaign: 'Champions Nights 2026',
      advertiser: 'Heineken 0.0',
      position: 'live_preroll',
      format: 'banner',
      content: 'Brinda a cada grande golo com transmissão em alta definição na LiveSports.',
      imageUrl: AD_CREATIVES.live_preroll,
      clickUrl: '/ao-vivo',
      impressions: 289100,
      clicks: 10450,
      ctr: 3.61,
      revenue: 9870.75,
    },
  ];

  // Pause generic placeholder Unsplash demo ads so crisp branded creatives take priority
  await prisma.$executeRawUnsafe(
    `UPDATE "ads" SET status = 'paused'::ad_status WHERE id IN ('demo-ad-1', 'demo-ad-2', 'demo-ad-3')`,
  ).catch(() => {});

  for (const ad of adsSeed) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "ads" (
          "id", "title", "campaign", "advertiser_name", "position", "format",
          "content", "image_url", "click_url", "status",
          "impressions", "clicks", "ctr", "revenue", "start_date", "end_date", "updated_at"
        )
        VALUES (
          $1, $2, $3, $4, $5::ad_position, $6::ad_format,
          $7, $8, $9, 'active'::ad_status,
          $10, $11, $12, $13, CURRENT_DATE - 5, CURRENT_DATE + 180, NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "title" = EXCLUDED."title",
          "campaign" = EXCLUDED."campaign",
          "advertiser_name" = EXCLUDED."advertiser_name",
          "image_url" = EXCLUDED."image_url",
          "click_url" = EXCLUDED."click_url",
          "status" = 'active'::ad_status,
          "end_date" = CURRENT_DATE + 180,
          "updated_at" = NOW()
      `,
      ad.id,
      ad.title,
      ad.campaign,
      ad.advertiser,
      ad.position,
      ad.format,
      ad.content,
      ad.imageUrl,
      ad.clickUrl,
      ad.impressions,
      ad.clicks,
      ad.ctr,
      ad.revenue,
    ).catch(() => {});
  }

  // Promotional Hero & In-Content Banners (`banners` table)
  const bannersSeed = [
    {
      id: 'banner-hero-champions-2026',
      title: 'UEFA Champions League 2026/27 em Direto',
      subtitle: 'Acompanha todos os jogos da fase de liga, estatísticas oficiais ao segundo e transmissões multi-servidor em Full HD.',
      badge: 'NOITES DE CHAMPIONS',
      imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=85',
      linkUrl: '/ao-vivo',
      ctaText: 'Assistir Jogos Agora',
      position: 'hero',
      sortOrder: 1,
    },
    {
      id: 'banner-hero-wc-2026',
      title: 'Central Copa do Mundo FIFA 2026',
      subtitle: '48 seleções, 104 partidas históricas nos EUA, Canadá e México. Consulta grupos, classificações e calendário.',
      badge: 'ESPECIAL MUNDIAL',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=85',
      linkUrl: '/copa-do-mundo',
      ctaText: 'Explorar Central',
      position: 'hero',
      sortOrder: 2,
    },
    {
      id: 'banner-incontent-vip',
      title: 'LiveSports+ Pro · Transmissão 4K Ultra Baixa Latência',
      subtitle: 'Zero interrupções publicitárias durante os jogos decisivos, 4 ecrãs em simultâneo e replays instantâneos.',
      badge: 'OFERTA EXCLUSIVA',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&q=85',
      linkUrl: '/plans',
      ctaText: 'Experimentar 7 Dias Grátis',
      position: 'in_content',
      sortOrder: 1,
    },
    {
      id: 'banner-sidebar-blog',
      title: 'Redação LiveSports · Notícias em Tempo Real',
      subtitle: 'Últimas horas de mercado, conferências de imprensa e resumos pós-jogo em Português e Inglês.',
      badge: 'BLOG & ANÁLISE',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=85',
      linkUrl: '/blog',
      ctaText: 'Ler Últimas Notícias',
      position: 'sidebar',
      sortOrder: 1,
    },
  ];

  for (const b of bannersSeed) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "banners" (
          "id", "title", "subtitle", "badge", "image_url", "link_url",
          "cta_text", "position", "active", "sort_order", "start_date", "end_date", "updated_at"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8::banner_position, TRUE, $9, CURRENT_DATE - 5, CURRENT_DATE + 180, NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "title" = EXCLUDED."title",
          "subtitle" = EXCLUDED."subtitle",
          "badge" = EXCLUDED."badge",
          "image_url" = EXCLUDED."image_url",
          "link_url" = EXCLUDED."link_url",
          "cta_text" = EXCLUDED."cta_text",
          "active" = TRUE,
          "updated_at" = NOW()
      `,
      b.id,
      b.title,
      b.subtitle,
      b.badge,
      b.imageUrl,
      b.linkUrl,
      b.ctaText,
      b.position,
      b.sortOrder,
    ).catch(() => {});
  }

  return { adsCount: adsSeed.length, bannersCount: bannersSeed.length };
}

export async function runRealContentSync(force = false) {
  const now = Date.now();
  if (!force && now - lastSyncAt < SYNC_COOLDOWN_MS) {
    return { skipped: true, lastSyncAt: new Date(lastSyncAt).toISOString() };
  }
  lastSyncAt = now;

  const [eventsAndLives, newsCount, promos] = await Promise.all([
    syncRealEventsAndLives(),
    syncRealNewsArticles(),
    syncAdvertisingAndBanners(),
  ]);

  console.log(
    `✅ [RealContentSync] events=${eventsAndLives.syncedEvents}, lives=${eventsAndLives.syncedLives}, news=${newsCount}, ads=${promos.adsCount}, banners=${promos.bannersCount}`,
  );

  return {
    skipped: false,
    syncedEvents: eventsAndLives.syncedEvents,
    syncedLives: eventsAndLives.syncedLives,
    syncedNews: newsCount,
    syncedAds: promos.adsCount,
    syncedBanners: promos.bannersCount,
    syncedAt: new Date().toISOString(),
  };
}
