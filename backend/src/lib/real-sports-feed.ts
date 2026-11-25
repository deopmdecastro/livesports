import axios from 'axios';

export interface EspnCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  score?: string;
  winner?: boolean;
  team: {
    id: string;
    name: string;
    displayName: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
  };
}

export interface EspnEventRaw {
  id: string;
  date: string;
  name: string;
  shortName?: string;
  competitions?: Array<{
    id: string;
    date: string;
    venue?: {
      fullName?: string;
      address?: { city?: string; country?: string };
    };
    competitors?: EspnCompetitor[];
    status?: {
      displayClock?: string;
      period?: number;
      type?: {
        name?: string;
        state?: 'pre' | 'in' | 'post';
        completed?: boolean;
        description?: string;
        shortDetail?: string;
      };
    };
  }>;
}

export interface RealSportEvent {
  id: string;
  externalId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  sport: 'football' | 'basketball' | 'tennis' | 'ufc' | 'f1' | 'volleyball' | 'baseball' | 'other';
  competitionId: string | null;
  stage: string | null;
  league: string;
  leagueLogo: string | null;
  teamA: string | null;
  teamACode: string | null;
  teamALogo: string | null;
  teamB: string | null;
  teamBCode: string | null;
  teamBLogo: string | null;
  scoreA: number | null;
  scoreB: number | null;
  matchTime: string;
  venue: string | null;
  scheduledAt: string;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  viewerCount: number;
}

export interface RealNewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string | null;
  sport: 'football' | 'basketball' | 'tennis' | 'ufc' | 'f1' | 'volleyball' | 'baseball' | 'other';
  tags: string[];
  sourceUrl: string;
  sourceName: string;
  sourceIcon: string | null;
  language: 'pt' | 'en';
  country: string[];
  publishedAt: string;
  provider: 'rss-rtp' | 'rss-bbc' | 'espn';
}

export interface PublicLiveChannel {
  url: string;
  name: string;
  quality: string;
  latency: string;
  language: string;
}

export const REAL_HLS_CHANNELS: Record<string, PublicLiveChannel[]> = {
  football: [
    {
      name: 'FIFA+ Portugal HD',
      url: 'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'pt',
    },
    {
      name: 'FIFA+ International',
      url: 'https://95cedebd.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/Vml6aW9fRklGQVBsdXNFbmdsaXNoX0hMUw/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'beIN SPORTS Xtra',
      url: 'https://dc1644a9jazgj.cloudfront.net/beIN_Sports_Xtra_Espanol.m3u8',
      quality: '1080p HD',
      latency: 'Estável',
      language: 'es',
    },
  ],
  basketball: [
    {
      name: 'ACC Basketball Network',
      url: 'https://raycom-accdn-firetv.amagi.tv/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'Fox Sports Live HD',
      url: 'https://skynewsau-live-premium.akamaized.net/hls/live/2105307/foxsportsnews/live_1080p.m3u8',
      quality: '1080p HD',
      latency: 'Estável',
      language: 'en',
    },
  ],
  ufc: [
    {
      name: 'GLORY Combat Live',
      url: 'https://6f972d29.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0dsb3J5S2lja2JveGluZ19ITFM/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'Red Bull Combat & Action',
      url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
      quality: '1080p HD',
      latency: 'Ultra-baixa',
      language: 'en',
    },
  ],
  f1: [
    {
      name: 'Red Bull Motorsport TV',
      url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
      quality: '1080p HD',
      latency: 'Ultra-baixa',
      language: 'en',
    },
    {
      name: 'Fox Sports News Motorsport',
      url: 'https://skynewsau-live-premium.akamaized.net/hls/live/2105307/foxsportsnews/live_1080p.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
  ],
  tennis: [
    {
      name: 'Africa 24 Sport Live',
      url: 'https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'fr',
    },
    {
      name: 'Fox Sports Court Desk',
      url: 'https://skynewsau-live-premium.akamaized.net/hls/live/2105307/foxsportsnews/live_1080p.m3u8',
      quality: '1080p HD',
      latency: 'Estável',
      language: 'en',
    },
  ],
  other: [
    {
      name: 'Fox Sports 24/7 HD',
      url: 'https://skynewsau-live-premium.akamaized.net/hls/live/2105307/foxsportsnews/live_1080p.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'Red Bull TV Global',
      url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
  ],
};

const SPORT_FALLBACK_THUMBS: Record<string, string[]> = {
  football: [
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80',
  ],
  basketball: [
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1200&q=80',
  ],
  tennis: [
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1200&q=80',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
  ],
  ufc: [
    'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=1200&q=80',
    'https://images.unsplash.com/photo-1544919982-b61976f0ba43?w=1200&q=80',
  ],
  f1: [
    'https://images.unsplash.com/photo-1583395838144-09c4f1d7c0f0?w=1200&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
  ],
};

function pickThumb(sport: string, index: number): string {
  const list = SPORT_FALLBACK_THUMBS[sport] || SPORT_FALLBACK_THUMBS.other;
  return list[index % list.length];
}

const ESPN_ENDPOINTS: Array<{
  url: string;
  sport: RealSportEvent['sport'];
  defaultLeague: string;
  competitionId: string | null;
}> = [
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard',
    sport: 'football',
    defaultLeague: 'UEFA Champions League',
    competitionId: 'comp-champions-league',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa/scoreboard',
    sport: 'football',
    defaultLeague: 'UEFA Europa League',
    competitionId: 'comp-europa-league',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
    sport: 'football',
    defaultLeague: 'Premier League',
    competitionId: 'comp-premier-league',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard',
    sport: 'football',
    defaultLeague: 'La Liga',
    competitionId: 'comp-la-liga',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/por.1/scoreboard',
    sport: 'football',
    defaultLeague: 'Liga Portugal',
    competitionId: 'comp-liga-portugal',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard',
    sport: 'football',
    defaultLeague: 'Serie A',
    competitionId: 'comp-serie-a',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/scoreboard',
    sport: 'football',
    defaultLeague: 'Brasileirão Série A',
    competitionId: 'comp-brasileirao',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    sport: 'basketball',
    defaultLeague: 'NBA',
    competitionId: null,
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard',
    sport: 'ufc',
    defaultLeague: 'UFC',
    competitionId: null,
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard',
    sport: 'f1',
    defaultLeague: 'Formula 1',
    competitionId: null,
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard',
    sport: 'tennis',
    defaultLeague: 'ATP Tour',
    competitionId: null,
  },
];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapEspnStatus(state?: string, completed?: boolean, name?: string): RealSportEvent['status'] {
  if (state === 'in') return 'live';
  if (state === 'post' || completed) {
    if (name && /CANCELED|POSTPONED|ABANDONED/i.test(name)) return 'cancelled';
    return 'finished';
  }
  return 'upcoming';
}

function parseScoreVal(score?: string): number | null {
  if (score === undefined || score === null || score === '') return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

export async function fetchEspnScoreboardEvents(): Promise<RealSportEvent[]> {
  const results = await Promise.allSettled(
    ESPN_ENDPOINTS.map(async (cfg) => {
      const response = await axios.get(cfg.url, { timeout: 10000 });
      const data = response.data || {};
      const leagueInfo = data.leagues?.[0] || {};
      const leagueName: string = leagueInfo.name || cfg.defaultLeague;
      const leagueLogo: string | null = leagueInfo.logos?.[0]?.href || null;
      const events: EspnEventRaw[] = data.events || [];

      return events.map((ev, idx): RealSportEvent | null => {
        const comp = ev.competitions?.[0];
        if (!comp) return null;

        const home = comp.competitors?.find((c) => c.homeAway === 'home') || comp.competitors?.[0];
        const away = comp.competitors?.find((c) => c.homeAway === 'away') || comp.competitors?.[1];

        const teamA = home?.team?.shortDisplayName || home?.team?.displayName || home?.team?.name || null;
        const teamB = away?.team?.shortDisplayName || away?.team?.displayName || away?.team?.name || null;
        const title = teamA && teamB ? `${teamA} vs ${teamB}` : ev.name || 'Evento Desportivo';

        const statusType = comp.status?.type;
        const status = mapEspnStatus(statusType?.state, statusType?.completed, statusType?.name);
        const scoreA = status === 'upcoming' ? null : parseScoreVal(home?.score);
        const scoreB = status === 'upcoming' ? null : parseScoreVal(away?.score);

        const matchTime =
          status === 'live'
            ? comp.status?.displayClock || statusType?.shortDetail || 'AO VIVO'
            : status === 'finished'
              ? 'FT'
              : statusType?.shortDetail || 'Agendado';

        const venueParts = [comp.venue?.fullName, comp.venue?.address?.city].filter(Boolean);
        const venue = venueParts.length > 0 ? venueParts.join(', ') : null;

        // Deterministic realistic viewer count when live
        const hash = Number(String(ev.id).slice(-4)) || 1200;
        const viewerCount = status === 'live' ? 4200 + (hash % 18500) : 0;

        return {
          id: `espn-${cfg.sport}-${ev.id}`,
          externalId: String(ev.id),
          title,
          description: `${leagueName}${venue ? ` · ${venue}` : ''}. Cobertura oficial em direto com dados atualizados em tempo real.`,
          thumbnail: pickThumb(cfg.sport, idx),
          sport: cfg.sport,
          competitionId: cfg.competitionId,
          stage: data.season?.slug ? String(data.season.slug).replace(/-/g, ' ').toUpperCase() : 'Fase Regular',
          league: leagueName,
          leagueLogo,
          teamA,
          teamACode: home?.team?.abbreviation || null,
          teamALogo: home?.team?.logo || null,
          teamB,
          teamBCode: away?.team?.abbreviation || null,
          teamBLogo: away?.team?.logo || null,
          scoreA,
          scoreB,
          matchTime: String(matchTime).slice(0, 20),
          venue,
          scheduledAt: comp.date || ev.date,
          status,
          viewerCount,
        };
      }).filter((x): x is RealSportEvent => Boolean(x));
    }),
  );

  const collected: RealSportEvent[] = [];
  for (const res of results) {
    if (res.status === 'fulfilled') {
      collected.push(...res.value);
    }
  }
  return collected;
}

// ─── Real Sports News via Public RSS & ESPN News API ──────────────────────────

const SPORT_KEYWORDS_GUESS: Array<{ sport: RealNewsItem['sport']; rx: RegExp }> = [
  { sport: 'f1', rx: /f[oó]rmula\s*1|\bf1\b|verstappen|hamilton|ferrari|mclaren|red bull racing|gp de|grand prix/i },
  { sport: 'basketball', rx: /basquet|basketball|\bnba\b|lakers|celtics|warriors|lebron|curry|neemias/i },
  { sport: 'tennis', rx: /t[eé]nis|tennis|\batp\b|\bwta\b|alcaraz|sinner|djokovic|wimbledon|roland garros|nuno borges/i },
  { sport: 'ufc', rx: /\bufc\b|\bmma\b|oct[oó]gono|pereira|mcgregor|adesanya|fight night/i },
  { sport: 'volleyball', rx: /voleibol|v[oó]lei|volleyball/i },
  { sport: 'football', rx: /futebol|football|soccer|champions|liga|benfica|porto|sporting|real madrid|barcelona|premier|sele[cç][aã]o|cristiano|mourinho|amorim|gyokeres/i },
];

function detectSport(text: string): RealNewsItem['sport'] {
  for (const item of SPORT_KEYWORDS_GUESS) {
    if (item.rx.test(text)) return item.sport;
  }
  return 'football';
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const rx = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(rx);
  return m ? decodeXmlEntities(m[1]) : '';
}

function parseRssItems(xml: string, lang: 'pt' | 'en', provider: RealNewsItem['provider'], sourceName: string): RealNewsItem[] {
  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  const items: RealNewsItem[] = [];

  for (let i = 0; i < itemBlocks.length; i++) {
    const block = itemBlocks[i];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractTag(block, 'guid');
    const rawDesc = extractTag(block, 'description');
    const pubDateRaw = extractTag(block, 'pubDate');
    const category = extractTag(block, 'category');

    if (!title || !link) continue;

    // Extract image from <media:thumbnail url="..."/>, <media:content url="..."/>, <enclosure url="..."/>, or <img src="..."/>
    const mediaThumbMatch =
      block.match(/<media:(?:thumbnail|content)[^>]+url=["']([^"']+)["']/i) ||
      block.match(/<enclosure[^>]+url=["']([^"']+)["']/i) ||
      rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);

    let thumbnail = mediaThumbMatch ? decodeXmlEntities(mediaThumbMatch[1]) : null;
    if (thumbnail && thumbnail.includes('w=350')) {
      thumbnail = thumbnail.replace('w=350', 'w=960').replace('q=50', 'q=80');
    }

    const cleanExcerpt = rawDesc
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const sport = detectSport(`${title} ${cleanExcerpt} ${category}`);
    if (!thumbnail) {
      thumbnail = pickThumb(sport, i);
    }

    const publishedAt = pubDateRaw && !Number.isNaN(new Date(pubDateRaw).getTime())
      ? new Date(pubDateRaw).toISOString()
      : new Date().toISOString();

    const tags = [
      category ? slugify(category) : sport,
      lang === 'pt' ? 'desporto' : 'sports',
      sourceName.toLowerCase().replace(/\s+/g, '-'),
    ].filter(Boolean);

    const richContent = [
      `<p class="lead"><strong>${cleanExcerpt || title}</strong></p>`,
      `<p>${
        lang === 'pt'
          ? `Acompanhe todos os desenvolvimentos desta notícia em destaque no universo de ${sport === 'football' ? 'futebol internacional' : sport}. A cobertura completa inclui análise tática, impacto nas tabelas classificativas e reações oficiais dos protagonistas.`
          : `Follow the latest developments on this breaking ${sport} story, including full match context, tactical implications, and official reactions from across the league.`
      }</p>`,
      `<p><em>${lang === 'pt' ? 'Fonte oficial' : 'Official source'}: <a href="${link}" target="_blank" rel="noopener noreferrer">${sourceName}</a></em></p>`,
    ].join('\n');

    items.push({
      id: `${provider}-${slugify(title).slice(0, 48)}`,
      title,
      slug: `${slugify(title).slice(0, 80)}-${lang}`,
      excerpt: cleanExcerpt.slice(0, 280) || title,
      content: richContent,
      thumbnail,
      sport,
      tags: Array.from(new Set(tags)),
      sourceUrl: link,
      sourceName,
      sourceIcon: null,
      language: lang,
      country: lang === 'pt' ? ['pt'] : ['gb', 'us'],
      publishedAt,
      provider,
    });
  }

  return items;
}

export async function fetchRealSportsNews(options?: {
  language?: string;
  q?: string;
}): Promise<RealNewsItem[]> {
  const langs = (options?.language || 'pt,en')
    .split(',')
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);

  const wantPt = langs.length === 0 || langs.includes('pt');
  const wantEn = langs.length === 0 || langs.includes('en');

  const tasks: Promise<RealNewsItem[]>[] = [];

  if (wantPt) {
    tasks.push(
      axios
        .get<string>('https://www.rtp.pt/noticias/rss/desporto', {
          timeout: 10000,
          responseType: 'text',
          headers: { 'User-Agent': 'LiveSportsBot/2.0 (+https://livesports.pt)' },
        })
        .then((res) => parseRssItems(res.data, 'pt', 'rss-rtp', 'RTP Desporto'))
        .catch(() => []),
    );
  }

  if (wantEn) {
    tasks.push(
      axios
        .get<string>('https://feeds.bbci.co.uk/sport/rss.xml', {
          timeout: 10000,
          responseType: 'text',
          headers: { 'User-Agent': 'LiveSportsBot/2.0 (+https://livesports.pt)' },
        })
        .then((res) => parseRssItems(res.data, 'en', 'rss-bbc', 'BBC Sport'))
        .catch(() => []),
    );

    tasks.push(
      axios
        .get('https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/news', { timeout: 10000 })
        .then((res) => {
          const articles: any[] = res.data?.articles || [];
          return articles.map((a, idx): RealNewsItem => {
            const headline = String(a.headline || 'Sports Headline');
            const desc = String(a.description || headline);
            const link = a.links?.web?.href || 'https://www.espn.com/soccer/';
            const img = a.images?.[0]?.url || pickThumb('football', idx);
            return {
              id: `espn-news-${a.id || idx}`,
              title: headline,
              slug: `${slugify(headline).slice(0, 80)}-en`,
              excerpt: desc,
              content: `<p><strong>${desc}</strong></p><p>Coverage from UEFA Champions League matchweek action, team press conferences, and squad updates.</p><p><em>Official source: <a href="${link}" target="_blank" rel="noopener noreferrer">ESPN Football</a></em></p>`,
              thumbnail: img,
              sport: detectSport(`${headline} ${desc}`),
              tags: ['champions-league', 'football', 'espn'],
              sourceUrl: link,
              sourceName: 'ESPN',
              sourceIcon: null,
              language: 'en',
              country: ['us'],
              publishedAt: a.published || a.lastModified || new Date().toISOString(),
              provider: 'espn',
            };
          });
        })
        .catch(() => []),
    );
  }

  const settled = await Promise.all(tasks);
  let merged = settled.flat();

  if (options?.q && options.q.trim() && options.q.trim().toLowerCase() !== 'sports') {
    const term = options.q.trim().toLowerCase();
    merged = merged.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.excerpt.toLowerCase().includes(term) ||
        item.sport.toLowerCase().includes(term),
    );
  }

  const seen = new Set<string>();
  return merged
    .filter((item) => {
      const key = item.slug || item.sourceUrl;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
