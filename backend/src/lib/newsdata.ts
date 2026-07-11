import axios from 'axios';

/**
 * Thin client for NewsData.io's "latest" endpoint, used to power the public
 * blog/news section with real sports news in Portuguese and English.
 *
 * Docs: https://newsdata.io/documentation
 * Free tier: 200 credits/day, 10 articles per credit, cursor-based
 * pagination (the `nextPage` string returned in the response, NOT a
 * numeric page index).
 */

const NEWSDATA_BASE_URL = 'https://newsdata.io/api/1/latest';

export interface NewsdataArticle {
  article_id: string;
  title: string;
  link: string;
  description?: string | null;
  content?: string | null;
  pubDate?: string;
  image_url?: string | null;
  source_id?: string;
  source_name?: string;
  source_icon?: string | null;
  language?: string;
  country?: string[];
  category?: string[];
  creator?: string[] | null;
  keywords?: string[] | null;
}

export interface NewsdataResponse {
  status: string;
  totalResults?: number;
  results?: NewsdataArticle[];
  nextPage?: string | null;
  results_count?: number;
}

export interface FetchNewsdataParams {
  apiKey: string;
  /** Free-text search query, e.g. "futebol OR ronaldo" */
  q?: string;
  /** Comma-separated ISO language codes, e.g. "pt,en" (max 5 on free/basic plans) */
  language?: string;
  /** Comma-separated categories, e.g. "sports" */
  category?: string;
  /** Comma-separated ISO country codes, e.g. "pt,br,us,gb" */
  country?: string;
  /** Cursor string returned as `nextPage` by a previous request */
  page?: string;
}

export function isMissingNewsdataKey(value?: string | null): boolean {
  const token = value?.trim();
  return !token || token === 'your-newsdata-api-key';
}

export async function fetchNewsdataLatest(params: FetchNewsdataParams): Promise<NewsdataResponse> {
  const { apiKey, q = 'sports', language = 'pt,en', category = 'sports', country, page } = params;

  const response = await axios.get<NewsdataResponse>(NEWSDATA_BASE_URL, {
    params: {
      apikey: apiKey,
      q: q || undefined,
      language: language || undefined,
      category: category || undefined,
      country: country || undefined,
      page: page || undefined,
      // Skip removed/duplicate stories so the blog import list stays clean.
      removeduplicate: 1,
    },
    timeout: 10000,
  });

  return response.data;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Best-effort guess at a matching internal SportCategory from NewsData.io's free-text category/keywords. */
const SPORT_KEYWORDS: Array<{ sport: string; matches: RegExp }> = [
  { sport: 'football', matches: /futebol|football|soccer|premier league|la liga|champions league|libertadores|brasileirao/i },
  { sport: 'basketball', matches: /basquete|basketball|nba|euroliga/i },
  { sport: 'tennis', matches: /tenis|tennis|atp|wta|roland garros|wimbledon/i },
  { sport: 'ufc', matches: /ufc|mma|artes marciais|mixed martial arts/i },
  { sport: 'f1', matches: /formula 1|formula1|f1\b|grande premio|grand prix/i },
  { sport: 'volleyball', matches: /volei|volleyball/i },
  { sport: 'baseball', matches: /beisebol|baseball|mlb/i },
];

export function guessSportCategory(article: Pick<NewsdataArticle, 'title' | 'description' | 'keywords'>): string {
  const haystack = [article.title, article.description, ...(article.keywords || [])].filter(Boolean).join(' ');
  const found = SPORT_KEYWORDS.find(({ matches }) => matches.test(haystack));
  return found?.sport || 'other';
}

/** Normalizes a raw NewsData.io article into the shape the frontend blog UI expects. */
export function mapNewsdataArticle(article: NewsdataArticle) {
  return {
    id: article.article_id,
    title: article.title,
    slug: slugify(article.title || article.article_id),
    excerpt: article.description || '',
    content: article.content || article.description || '',
    thumbnail: article.image_url || null,
    sport: guessSportCategory(article),
    tags: article.keywords || [],
    sourceUrl: article.link,
    sourceName: article.source_name || article.source_id || null,
    sourceIcon: article.source_icon || null,
    language: article.language || null,
    country: article.country || [],
    publishedAt: article.pubDate || null,
  };
}

export type MappedNewsdataArticle = ReturnType<typeof mapNewsdataArticle>;
