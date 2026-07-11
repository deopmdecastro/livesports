/**
 * Minimal PT<->EN translator used to auto-generate the "other language"
 * version of an imported news article.
 *
 * Uses MyMemory (https://mymemory.translated.net) — free, no API key
 * required, which matches how this project handles NewsData.io/NewsAPI
 * (only failing gracefully when a key/service is unavailable, never hard
 * crashing the request that triggered it).
 *
 * MyMemory's free tier caps each request at ~500 bytes of source text, so
 * longer article bodies are split into paragraph-sized chunks and translated
 * sequentially, then re-joined.
 */

import axios from 'axios';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const MAX_CHUNK_LENGTH = 450;

export type SupportedLanguage = 'pt' | 'en';

/** Only PT and EN are auto-translated — anything else is left alone. */
export function isTranslatablePair(language?: string | null): language is SupportedLanguage {
  return language === 'pt' || language === 'en';
}

export function oppositeLanguage(language: SupportedLanguage): SupportedLanguage {
  return language === 'pt' ? 'en' : 'pt';
}

/** Splits text into chunks under MAX_CHUNK_LENGTH without breaking words/sentences where possible. */
function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) return [text];

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > MAX_CHUNK_LENGTH) {
      // Single sentence too long on its own — hard-split by words.
      if (current) {
        chunks.push(current);
        current = '';
      }
      const words = sentence.split(' ');
      let chunk = '';
      for (const word of words) {
        if ((chunk + ' ' + word).trim().length > MAX_CHUNK_LENGTH) {
          chunks.push(chunk.trim());
          chunk = word;
        } else {
          chunk = `${chunk} ${word}`.trim();
        }
      }
      if (chunk) chunks.push(chunk.trim());
      continue;
    }

    if ((current + ' ' + sentence).trim().length > MAX_CHUNK_LENGTH) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  }
  if (current) chunks.push(current.trim());

  return chunks;
}

async function translateChunk(text: string, source: SupportedLanguage, target: SupportedLanguage): Promise<string> {
  if (!text.trim()) return text;

  const response = await axios.get(MYMEMORY_URL, {
    params: { q: text, langpair: `${source}|${target}` },
    timeout: 10000,
  });

  const translated = response.data?.responseData?.translatedText;
  if (!translated || response.data?.responseStatus >= 400) {
    throw new Error(`Falha na traducao (${source} -> ${target}): ${response.data?.responseDetails || 'resposta invalida'}`);
  }
  return translated;
}

/** Translates a single string PT<->EN, chunking long text and rejoining. Throws on failure. */
export async function translateText(text: string, source: SupportedLanguage, target: SupportedLanguage): Promise<string> {
  if (!text?.trim()) return text || '';

  const chunks = chunkText(text);
  const translated: string[] = [];
  for (const chunk of chunks) {
    // Sequential on purpose — MyMemory's free tier rate-limits aggressively per second.
    translated.push(await translateChunk(chunk, source, target));
  }
  return translated.join(' ');
}

export interface TranslatableArticleFields {
  title: string;
  excerpt?: string | null;
  content?: string | null;
}

/** Translates title/excerpt/content together. Throws if the title (the essential field) fails. */
export async function translateArticleFields(
  fields: TranslatableArticleFields,
  source: SupportedLanguage,
  target: SupportedLanguage
): Promise<TranslatableArticleFields> {
  const title = await translateText(fields.title, source, target);
  const [excerpt, content] = await Promise.all([
    fields.excerpt ? translateText(fields.excerpt, source, target).catch(() => fields.excerpt || '') : Promise.resolve(fields.excerpt || ''),
    fields.content ? translateText(fields.content, source, target).catch(() => fields.content || '') : Promise.resolve(fields.content || ''),
  ]);
  return { title, excerpt, content };
}
