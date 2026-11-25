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

export interface FreeSportsTvChannel {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  sport: 'football' | 'basketball' | 'tennis' | 'ufc' | 'f1' | 'volleyball' | 'baseball' | 'other';
  league: string;
  logo: string;
  logoBackups?: string[];
  banner: string;
  language: string;
  quality: string;
  country: string;
  streamUrl: string;
  backupServers: PublicLiveChannel[];
  featured: boolean;
  viewerBase: number;
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
    {
      name: 'Sportitalia Solocalcio',
      url: 'https://distribution.sportitalialive.it/sportitalia/sisolocalcio_abr/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'it',
    },
    {
      name: 'talkSPORT TV UK',
      url: 'https://af7a8b4e.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctZ2JfdGFsa1NQT1JUX0hMUw/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
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
      name: 'Overtime Sports HD',
      url: 'https://d1a8aq6t30gkqj.cloudfront.net/v1/amc_overtime_1/samsungheadend_us/latest/main/hls/playlist_hd.m3u8',
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
      name: 'FITE 24/7 MMA & Combat',
      url: 'https://d3d85c7qkywguj.cloudfront.net/scheduler/scheduleMaster/263.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'GLORY Kickboxing Live',
      url: 'https://6f972d29.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0dsb3J5S2lja2JveGluZ19ITFM/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'FightBox HD',
      url: 'https://webtvstream.bhtelecom.ba/fightbox.m3u8',
      quality: '720p HD',
      latency: 'Estável',
      language: 'en',
    },
    {
      name: 'Swerve Combat HD',
      url: 'https://linear-253.frequency.stream/mt/roku/253/hls/master/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
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
      name: 'Rally TV WRC 1080p',
      url: 'https://rally-tv-live.akamaized.net/hls/live/2117704/RallyTV-Pri/master.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'FloRacing Live HD',
      url: 'https://amg02278-amg02278c1-flosports-worldwide-7592.playouts.now.amagi.tv/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'Racer Select Network',
      url: 'https://amg00378-amg00378c4-freelivesports-emea-5637.playouts.now.amagi.tv/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Estável',
      language: 'en',
    },
  ],
  tennis: [
    {
      name: 'Tennis Channel 2 HD',
      url: 'https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'Unbeaten Court & Sports',
      url: 'https://d1t5afz6qed3xk.cloudfront.net/Unbeaten.m3u8',
      quality: '1080p HD',
      latency: 'Estável',
      language: 'en',
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
      name: 'ESPN8: The Ocho HD',
      url: 'https://d3b6q2ou5kp8ke.cloudfront.net/ESPNTheOcho.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'Fox Sports 24/7 HD',
      url: 'https://skynewsau-live-premium.akamaized.net/hls/live/2105307/foxsportsnews/live_1080p.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'PGA Tour Live HD',
      url: 'https://d11k1mnrgfposz.cloudfront.net/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Baixa',
      language: 'en',
    },
    {
      name: 'World of Freesports',
      url: 'https://mainstreammedia-worldoffreesportsintl-rakuten.amagi.tv/playlist.m3u8',
      quality: '1080p HD',
      latency: 'Estável',
      language: 'en',
    },
  ],
};

export const FREE_SPORTS_TV_CHANNELS: FreeSportsTvChannel[] = [
  {
    id: 'free-tv-fifa-pt',
    slug: 'fifa-plus-portugal',
    name: 'FIFA+ Portugal TV',
    tagline: 'Futebol Mundial 24/7 em Português',
    description: 'Canal oficial gratuito FIFA+ em Português com jogos históricos do Mundial, documentários originais, torneios FIFA ao vivo e resumos alargados.',
    sport: 'football',
    league: 'TV Desportiva Gratuita · Futebol',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png',
    logoBackups: [
      'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/FIFA%2B_(2025).svg/512px-FIFA%2B_(2025).svg.png',
    ],
    banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1400&q=85',
    language: 'PT',
    quality: '1080p FHD',
    country: 'PT / BR',
    streamUrl: 'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.football,
    featured: true,
    viewerBase: 4820,
  },
  {
    id: 'free-tv-bein-xtra',
    slug: 'bein-sports-xtra',
    name: 'beIN SPORTS XTRA HD',
    tagline: 'Futebol Europeu, Ligas & Diretos',
    description: 'Transmissão aberta 24 horas da beIN SPORTS XTRA com futebol europeu e sul-americano, programas de análise tática e eventos ao vivo.',
    sport: 'football',
    league: 'TV Desportiva Gratuita · Futebol',
    logo: 'https://i.imgur.com/V562tpO.png',
    logoBackups: [
      'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    ],
    banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=85',
    language: 'ES',
    quality: '1080p FHD',
    country: 'INT',
    streamUrl: 'https://dc1644a9jazgj.cloudfront.net/beIN_Sports_Xtra_Espanol.m3u8',
    backupServers: REAL_HLS_CHANNELS.football,
    featured: true,
    viewerBase: 3910,
  },
  {
    id: 'free-tv-fifa-en',
    slug: 'fifa-plus-global',
    name: 'FIFA+ Global HD',
    tagline: 'Torneios FIFA & Clássicos do Futebol',
    description: 'Sinal internacional em alta definição da FIFA+ com transmissões de seleções, futebol de formação, futsal e grandes finais mundiais.',
    sport: 'football',
    league: 'TV Desportiva Gratuita · Futebol',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png',
    logoBackups: [
      'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png',
    ],
    banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'GLOBAL',
    streamUrl: 'https://95cedebd.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/Vml6aW9fRklGQVBsdXNFbmdsaXNoX0hMUw/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.football,
    featured: false,
    viewerBase: 2640,
  },
  {
    id: 'free-tv-fifa-women',
    slug: 'fifa-plus-women',
    name: 'FIFA+ Futebol Feminino',
    tagline: 'Ligas & Seleções Femininas 24/7',
    description: 'Canal dedicado 100% ao futebol feminino internacional, Mundial Feminino FIFA, golos e jogos completos em sinal aberto.',
    sport: 'football',
    league: 'TV Desportiva Gratuita · Futebol',
    logo: 'https://i.imgur.com/xy9ZxVO.png',
    banner: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1400&q=85',
    language: 'EN',
    quality: '720p HD',
    country: 'GLOBAL',
    streamUrl: 'https://cffda8ff.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/U2Ftc3VuZy1nYl9GSUZBUGx1c3dvbWVuX0hMUw/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.football,
    featured: false,
    viewerBase: 1490,
  },
  {
    id: 'free-tv-inter-tv',
    slug: 'inter-tv-milano',
    name: 'Inter TV Official',
    tagline: 'Canal Oficial FC Internazionale Milano',
    description: 'Bastidores em direto de Milão, conferências de imprensa, treinos, resumos da Serie A e UEFA Champions League no canal oficial do Inter.',
    sport: 'football',
    league: 'Canal de Clube · Serie A',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
    logoBackups: [
      'https://i.imgur.com/FUTqh2L.png',
      'https://crests.football-data.org/108.png',
    ],
    banner: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1400&q=85',
    language: 'IT',
    quality: '1080p FHD',
    country: 'IT',
    streamUrl: 'https://d3k8wzt41aflvx.cloudfront.net/INTERTV/Live.m3u8',
    backupServers: REAL_HLS_CHANNELS.football,
    featured: false,
    viewerBase: 2180,
  },
  {
    id: 'free-tv-sportitalia',
    slug: 'sportitalia-solocalcio',
    name: 'Sportitalia Solocalcio',
    tagline: '24 Horas de Futebol em Direto',
    description: 'Jogos em direto, campeonatos jovens, taças internacionais, mercado de transferências e debates de futebol italiano e europeu.',
    sport: 'football',
    league: 'TV Desportiva Gratuita · Futebol',
    logo: 'https://i.imgur.com/hu56Ya5.png',
    banner: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1400&q=85',
    language: 'IT',
    quality: '1080p FHD',
    country: 'IT',
    streamUrl: 'https://distribution.sportitalialive.it/sportitalia/sisolocalcio_abr/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.football,
    featured: false,
    viewerBase: 1930,
  },
  {
    id: 'free-tv-lazio-style',
    slug: 'lazio-style-channel',
    name: 'Lazio Style Channel HD',
    tagline: 'Canal Oficial S.S. Lazio',
    description: 'Emissão oficial da S.S. Lazio em Roma com diretos pré e pós-jogo, entrevistas exclusivas e transmissões do clube.',
    sport: 'football',
    league: 'Canal de Clube · Serie A',
    logo: 'https://i.imgur.com/vDB8HFq.png',
    banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1400&q=85',
    language: 'IT',
    quality: '720p HD',
    country: 'IT',
    streamUrl: 'https://distribution.sportitalialive.it/origin/laziostyle_abr/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.football,
    featured: false,
    viewerBase: 1120,
  },
  {
    id: 'free-tv-talksport',
    slug: 'talksport-uk-live',
    name: 'talkSPORT TV UK',
    tagline: 'Premier League Studio & Live Reactions',
    description: 'O maior estúdio desportivo britânico em direto com relato, reação aos jogos da Premier League e Champions League 24/7.',
    sport: 'football',
    league: 'TV Desportiva Gratuita · Premier League',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/9d/Talksport_logo.png',
    banner: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'UK',
    streamUrl: 'https://af7a8b4e.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctZ2JfdGFsa1NQT1JUX0hMUw/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.football,
    featured: false,
    viewerBase: 2350,
  },
  {
    id: 'free-tv-redbull',
    slug: 'red-bull-tv-motorsport',
    name: 'Red Bull TV Motorsport',
    tagline: 'Desportos Motorizados, Rally & Ação 24/7',
    description: 'Canal oficial Red Bull TV com corridas ao vivo, bastidores de Fórmula 1, Drift Masters, Hard Enduro, WRC e desportos radicais em 1080p.',
    sport: 'f1',
    league: 'TV Desportiva Gratuita · Motores',
    logo: 'https://i.imgur.com/a9ZtP17.png',
    banner: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'GLOBAL',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    backupServers: REAL_HLS_CHANNELS.f1,
    featured: true,
    viewerBase: 3680,
  },
  {
    id: 'free-tv-rally-wrc',
    slug: 'rally-tv-wrc',
    name: 'Rally TV · WRC Live',
    tagline: 'World Rally Championship 24/7',
    description: 'Canal dedicado ao Campeonato Mundial de Ralis (WRC) e ERC com etapas cronometradas, câmaras onboard e resumos oficiais.',
    sport: 'f1',
    league: 'TV Desportiva Gratuita · WRC & Motores',
    logo: 'https://i.imgur.com/CurtYvn.png',
    banner: 'https://images.unsplash.com/photo-1532906619279-a4b7267faa66?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'GLOBAL',
    streamUrl: 'https://rally-tv-live.akamaized.net/hls/live/2117704/RallyTV-Pri/master.m3u8',
    backupServers: REAL_HLS_CHANNELS.f1,
    featured: false,
    viewerBase: 2290,
  },
  {
    id: 'free-tv-floracing',
    slug: 'floracing-motorsports',
    name: 'FloRacing 24/7 HD',
    tagline: 'Corridas de Pista, Sprint Cars & GT',
    description: 'Transmissão contínua de automobilismo norte-americano e internacional, corridas em circuito, Nascar Roots e provas de velocidade.',
    sport: 'f1',
    league: 'TV Desportiva Gratuita · Automobilismo',
    logo: 'https://i.imgur.com/jZgcm4k.png',
    banner: 'https://images.unsplash.com/photo-1541447271487-09612b3f49f7?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'US',
    streamUrl: 'https://amg02278-amg02278c1-flosports-worldwide-7592.playouts.now.amagi.tv/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.f1,
    featured: false,
    viewerBase: 1740,
  },
  {
    id: 'free-tv-racer-select',
    slug: 'racer-select-tv',
    name: 'Racer Select Motorsport',
    tagline: 'GT, Endurance & Desporto Automóvel',
    description: 'Cobertura especializada de corridas de resistência, monolugares, IMSA, testes de pista e documentários de engenharia automóvel.',
    sport: 'f1',
    league: 'TV Desportiva Gratuita · Automobilismo',
    logo: 'https://i.imgur.com/CurtYvn.png',
    banner: 'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'GLOBAL',
    streamUrl: 'https://amg00378-amg00378c4-freelivesports-emea-5637.playouts.now.amagi.tv/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.f1,
    featured: false,
    viewerBase: 1380,
  },
  {
    id: 'free-tv-fite-combat',
    slug: 'fite-24-7-combat',
    name: 'FITE 24/7 · TrillerTV Combat',
    tagline: 'MMA, Boxe & Desportos de Combate',
    description: 'Canal aberto da FITE / TrillerTV com galas de MMA, boxe profissional, grappling e grandes combates internacionais 24 horas por dia.',
    sport: 'ufc',
    league: 'TV Desportiva Gratuita · MMA & Boxe',
    logo: 'https://i.imgur.com/ESV6qgH.png',
    banner: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'GLOBAL',
    streamUrl: 'https://d3d85c7qkywguj.cloudfront.net/scheduler/scheduleMaster/263.m3u8',
    backupServers: REAL_HLS_CHANNELS.ufc,
    featured: true,
    viewerBase: 3420,
  },
  {
    id: 'free-tv-glory',
    slug: 'glory-kickboxing-tv',
    name: 'GLORY Kickboxing HD',
    tagline: 'A Maior Liga Mundial de Kickboxing',
    description: 'Canal oficial GLORY com eventos principais, nocautes históricos, pesagens e lutas pelo título mundial de pesos-pesados.',
    sport: 'ufc',
    league: 'TV Desportiva Gratuita · Kickboxing',
    logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
    logoBackups: [
      'https://i.imgur.com/tS7Ub7i.png',
    ],
    banner: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'GLOBAL',
    streamUrl: 'https://6f972d29.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0dsb3J5S2lja2JveGluZ19ITFM/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.ufc,
    featured: false,
    viewerBase: 2510,
  },
  {
    id: 'free-tv-fightbox',
    slug: 'fightbox-hd',
    name: 'FightBox HD International',
    tagline: 'Artes Marciais, Muay Thai & MMA',
    description: 'Transmissão 24/7 dedicada às artes marciais mistas, King of Kings, Muay Thai, Judo e torneios europeus de combate.',
    sport: 'ufc',
    league: 'TV Desportiva Gratuita · Combate',
    logo: 'https://i.imgur.com/mRsnztA.png',
    banner: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=1400&q=85',
    language: 'EN',
    quality: '720p HD',
    country: 'EU',
    streamUrl: 'https://webtvstream.bhtelecom.ba/fightbox.m3u8',
    backupServers: REAL_HLS_CHANNELS.ufc,
    featured: false,
    viewerBase: 1860,
  },
  {
    id: 'free-tv-swerve-combat',
    slug: 'swerve-combat-tv',
    name: 'Swerve Combat 1080p',
    tagline: 'PFL, Combate Global & Boxe ao Vivo',
    description: 'Canal gratuito de lutas com arquivos e eventos completos de MMA, PFL, boxe sem luvas e torneios internacionais.',
    sport: 'ufc',
    league: 'TV Desportiva Gratuita · MMA',
    logo: 'https://i.imgur.com/eFZh7aG.png',
    banner: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'US',
    streamUrl: 'https://linear-253.frequency.stream/mt/roku/253/hls/master/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.ufc,
    featured: false,
    viewerBase: 1620,
  },
  {
    id: 'free-tv-accdn-basket',
    slug: 'acc-digital-network-basketball',
    name: 'ACC Basketball Network',
    tagline: 'Basquetebol Universitário & Destaques NBA',
    description: 'Jogos completos, resumos e análises da Atlantic Coast Conference — berço das maiores estrelas da NBA (Duke, UNC, Miami).',
    sport: 'basketball',
    league: 'TV Desportiva Gratuita · Basquetebol',
    logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    logoBackups: [
      'https://i.imgur.com/V6Kaqha.png',
    ],
    banner: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'US',
    streamUrl: 'https://raycom-accdn-firetv.amagi.tv/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.basketball,
    featured: true,
    viewerBase: 2890,
  },
  {
    id: 'free-tv-overtime',
    slug: 'overtime-sports-hd',
    name: 'Overtime Elite Basketball',
    tagline: 'Basquetebol Overtime Elite & Cultura Hoops',
    description: 'A liga Overtime Elite (OTE) em direto, torneios 3x3, documentários das próximas estrelas do Draft da NBA e jogos em 1080p.',
    sport: 'basketball',
    league: 'TV Desportiva Gratuita · Basquetebol',
    logo: 'https://i.imgur.com/9S9k4IK.png',
    banner: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'US',
    streamUrl: 'https://d1a8aq6t30gkqj.cloudfront.net/v1/amc_overtime_1/samsungheadend_us/latest/main/hls/playlist_hd.m3u8',
    backupServers: REAL_HLS_CHANNELS.basketball,
    featured: false,
    viewerBase: 2430,
  },
  {
    id: 'free-tv-tennis-ch2',
    slug: 'tennis-channel-2-hd',
    name: 'Tennis Channel 2 HD',
    tagline: 'Ténis Mundial ATP, WTA & Torneios 24/7',
    description: 'Cobertura contínua de ténis profissional com encontros ATP/WTA, resumos de Grand Slams, entrevistas de court e análise técnica.',
    sport: 'tennis',
    league: 'TV Desportiva Gratuita · Ténis',
    logo: 'https://i.imgur.com/LmkNt3v.png',
    banner: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'GLOBAL',
    streamUrl: 'https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8',
    backupServers: REAL_HLS_CHANNELS.tennis,
    featured: true,
    viewerBase: 2150,
  },
  {
    id: 'free-tv-espn-ocho',
    slug: 'espn8-the-ocho',
    name: 'ESPN8: The Ocho HD',
    tagline: 'Competição & Desportos Alternativos ESPN',
    description: 'O lendário canal gratuito da ESPN com competições espetaculares, torneios mundiais, campeonatos universitários e entretenimento desportivo.',
    sport: 'other',
    league: 'TV Desportiva Gratuita · Multidesporto',
    logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    logoBackups: [
      'https://i.imgur.com/00tsvjE.png',
    ],
    banner: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'US',
    streamUrl: 'https://d3b6q2ou5kp8ke.cloudfront.net/ESPNTheOcho.m3u8',
    backupServers: REAL_HLS_CHANNELS.other,
    featured: true,
    viewerBase: 3190,
  },
  {
    id: 'free-tv-fox-sports-news',
    slug: 'fox-sports-news-24-7',
    name: 'Fox Sports News 1080p',
    tagline: 'Noticiário Desportivo em Direto 24h',
    description: 'Últimas horas de todas as modalidades, conferências de imprensa em direto, resultados ao minuto e painéis de comentadores.',
    sport: 'other',
    league: 'TV Desportiva Gratuita · Notícias 24/7',
    logo: 'https://i.imgur.com/FhMQrJk.png',
    banner: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'AU / INT',
    streamUrl: 'https://skynewsau-live-premium.akamaized.net/hls/live/2105307/foxsportsnews/live_1080p.m3u8',
    backupServers: REAL_HLS_CHANNELS.other,
    featured: false,
    viewerBase: 2070,
  },
  {
    id: 'free-tv-pga-tour',
    slug: 'pga-tour-live-channel',
    name: 'PGA Tour Channel HD',
    tagline: 'Golfe Profissional & Torneios PGA 24/7',
    description: 'Canal oficial gratuito do PGA Tour com voltas finais históricas, melhores tacadas da temporada, resumos e antevisões dos Majors.',
    sport: 'other',
    league: 'TV Desportiva Gratuita · Golfe',
    logo: 'https://i.imgur.com/J0TY9dG.png',
    banner: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1400&q=85',
    language: 'EN',
    quality: '1080p FHD',
    country: 'US',
    streamUrl: 'https://d11k1mnrgfposz.cloudfront.net/playlist.m3u8',
    backupServers: REAL_HLS_CHANNELS.other,
    featured: false,
    viewerBase: 1540,
  },
];

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
