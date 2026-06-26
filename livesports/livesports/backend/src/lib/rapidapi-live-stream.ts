import axios from 'axios';

export const RAPIDAPI_LIVE_STREAM_HOST = 'all-sport-live-stream.p.rapidapi.com';
export const RAPIDAPI_LIVE_STREAM_URL = `https://${RAPIDAPI_LIVE_STREAM_HOST}/api/v2/br/all-live-stream`;

export type RapidApiLiveMatch = {
  match_id: number;
  team_one_name: string;
  team_two_name: string;
  team_one_id: number;
  team_two_id: number;
  start_time: string;
  score: string;
  iframe_source: string;
  m3u8_source: string;
  Other: string;
};

export type RapidApiSportGroup = {
  data: RapidApiLiveMatch[] | null;
  sport_id: number;
  sport_name: string;
};

export type MappedRapidApiLive = {
  id: string;
  matchId: number;
  title: string;
  teamA: string;
  teamB: string;
  league: string;
  sport: string;
  scoreA: number | null;
  scoreB: number | null;
  m3u8Url: string;
  hlsUrl: string;
  streamUrl: string;
  streamServers: Array<{
    id: string;
    name: string;
    quality: string;
    latency: string;
    url: string;
  }>;
  scheduledAt: string;
  matchTime: string;
  status: 'live';
  description: string;
};

export function isMissingRapidApiKey(value?: string) {
  const token = value?.trim();
  return !token || token === 'your-rapidapi-key';
}

export function parseScore(score: string) {
  const parts = score.split(':').map((part) => Number.parseInt(part.trim(), 10));
  if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
    return { scoreA: parts[0], scoreB: parts[1] };
  }
  return { scoreA: null, scoreB: null };
}

export function mapSportName(sportName: string) {
  const normalized = sportName.trim().toLowerCase();
  const map: Record<string, string> = {
    soccer: 'football',
    football: 'football',
    basketball: 'basketball',
    tennis: 'tennis',
    volleyball: 'volleyball',
    baseball: 'baseball',
  };
  return map[normalized] || 'other';
}

export function isPlayableStreamUrl(url?: string) {
  if (!url?.trim()) return false;
  const normalized = url.trim().toLowerCase();
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return false;
  return normalized.startsWith('http');
}

export function flattenRapidApiLiveStreams(groups: RapidApiSportGroup[]) {
  const items: MappedRapidApiLive[] = [];

  for (const group of groups) {
    if (!group.data?.length) continue;

    for (const match of group.data) {
      const streamUrl = match.m3u8_source?.trim();
      if (!isPlayableStreamUrl(streamUrl)) continue;

      const { scoreA, scoreB } = parseScore(match.score || '');
      const title = `${match.team_one_name} vs ${match.team_two_name}`;

      items.push({
        id: `rapidapi-live-${match.match_id}`,
        matchId: match.match_id,
        title,
        teamA: match.team_one_name,
        teamB: match.team_two_name,
        league: group.sport_name,
        sport: mapSportName(group.sport_name),
        scoreA,
        scoreB,
        m3u8Url: streamUrl,
        hlsUrl: streamUrl,
        streamUrl,
        streamServers: [
          {
            id: 'hls-primary',
            name: 'HLS Principal',
            quality: 'Auto HD',
            latency: 'Baixa',
            url: streamUrl,
          },
        ],
        scheduledAt: match.start_time || new Date().toISOString(),
        matchTime: match.score || 'Ao vivo',
        status: 'live',
        description: `${group.sport_name} · Stream importado da RapidAPI (match ${match.match_id}).`,
      });
    }
  }

  return items;
}

export async function fetchRapidApiLiveStreams(apiKey: string) {
  const response = await axios.get<RapidApiSportGroup[]>(RAPIDAPI_LIVE_STREAM_URL, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': RAPIDAPI_LIVE_STREAM_HOST,
      'x-rapidapi-key': apiKey,
    },
    timeout: 20000,
  });

  return response.data;
}

export const DEV_RAPIDAPI_LIVE_STREAMS: RapidApiSportGroup[] = [
  {
    sport_id: 19,
    sport_name: 'Table Tennis',
    data: [
      {
        match_id: 34971841,
        team_one_name: 'Szymik, Robert',
        team_two_name: 'Kaczmarek, Jakub',
        team_one_id: 290965,
        team_two_id: 288649,
        start_time: new Date().toISOString(),
        score: '2:0',
        iframe_source: 'https://br.scoreswift.in/live/?src=demo',
        m3u8_source:
          'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        Other: '',
      },
      {
        match_id: 34971844,
        team_one_name: 'Braun, Josef',
        team_two_name: 'Jadczyk, Marcin',
        team_one_id: 285958,
        team_two_id: 284250,
        start_time: new Date().toISOString(),
        score: '0:0',
        iframe_source: 'https://br.scoreswift.in/live/?src=demo2',
        m3u8_source:
          'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        Other: '',
      },
    ],
  },
  {
    sport_id: 63,
    sport_name: 'Counter-Strike',
    data: [
      {
        match_id: 34972606,
        team_one_name: 'Purple haze',
        team_two_name: 'NightRaid',
        team_one_id: 338659,
        team_two_id: 381126,
        start_time: new Date().toISOString(),
        score: '0:1',
        iframe_source: '',
        m3u8_source:
          'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        Other: '',
      },
    ],
  },
];
