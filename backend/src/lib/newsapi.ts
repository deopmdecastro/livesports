import axios from 'axios';

/**
 * Thin client for NewsAPI.org's "top-headlines" endpoint. This integration is
 * intentionally locked to `category=sports` — the whole point of hitting this
 * endpoint from this app is sports news for the blog, so we don't expose a
 * way to widen it to other categories.
 *
 * Docs: https://newsapi.org/docs/endpoints/top-headlines
 *
 * Important: `/v2/top-headlines` has NO `language` parameter — language is
 * approximated via `country` instead (e.g. country=pt for Portuguese,
 * country=us for English), and only one country can be requested per call.
 */

const NEWSAPI_BASE_URL = 'https://newsapi.org/v2/top-headlines';

export interface NewsApiArticle {
  source: { id: string | null; name: string };
  author?: string | null;
  title: string;
  description?: string | null;
  url: string;
  urlToImage?: string | null;
  publishedAt: string;
  content?: string | null;
}

export interface NewsApiResponse {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
  code?: string;
  message?: string;
}

export function isMissingNewsApiKey(value?: string | null): boolean {
  const token = value?.trim();
  return !token || token === 'your-newsapi-key';
}

/** Rough language → country mapping (NewsAPI has no language param on top-headlines). */
export const NEWSAPI_LANGUAGE_COUNTRY: Record<string, string> = {
  pt: 'pt',
  en: 'us',
};

export async function fetchNewsApiTopHeadlines(params: {
  apiKey: string;
  country?: string;
  q?: string;
  pageSize?: number;
  page?: number;
}): Promise<NewsApiResponse> {
  const { apiKey, country = 'us', q, pageSize = 20, page } = params;

  const response = await axios.get<NewsApiResponse>(NEWSAPI_BASE_URL, {
    params: {
      category: 'sports', // hard-locked — sports-only integration
      country,
      q: q || undefined,
      pageSize,
      page,
    },
    headers: { 'X-Api-Key': apiKey },
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

/** Normalizes a raw NewsAPI.org article into the same shape used for NewsData.io. */
export function mapNewsApiArticle(article: NewsApiArticle, language: string) {
  const slug = slugify(article.title || article.url);
  return {
    id: `newsapi-${slug || Buffer.from(article.url).toString('hex').slice(0, 16)}`,
    title: article.title,
    slug,
    excerpt: article.description || '',
    content: article.content || article.description || '',
    thumbnail: article.urlToImage || null,
    sport: 'other', // NewsAPI only exposes the broad "sports" category, no sub-sport
    tags: [] as string[],
    sourceUrl: article.url,
    sourceName: article.source?.name || null,
    sourceIcon: null as string | null,
    language,
    country: [] as string[],
    publishedAt: article.publishedAt || null,
    provider: 'newsapi' as const,
  };
}

export type MappedNewsApiArticle = ReturnType<typeof mapNewsApiArticle>;
