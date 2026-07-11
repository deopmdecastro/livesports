import type { NewsArticle } from "@/types";

export type BlogLanguage = "pt" | "en";
export type BlogLanguageFilter = "all" | BlogLanguage;

export interface NewsArticleGroup {
  groupId: string;
  canonicalId: string;
  variants: NewsArticle[];
  availableLanguages: BlogLanguage[];
  hasTranslation: boolean;
}

function toTimestamp(article: NewsArticle): number {
  return new Date(article.publishedAt || article.updatedAt || article.createdAt || 0).getTime();
}

export function normalizeArticleLanguage(article: NewsArticle): BlogLanguage | null {
  const value = article.language?.trim().toLowerCase();
  if (value === "pt" || value === "en") return value;

  const slug = article.slug?.toLowerCase() || "";
  if (slug.endsWith("-pt")) return "pt";
  if (slug.endsWith("-en")) return "en";

  return null;
}

export function getArticleGroupId(article: NewsArticle): string {
  return article.translationOfId || article.id;
}

function sortArticles(a: NewsArticle, b: NewsArticle) {
  return toTimestamp(b) - toTimestamp(a);
}

export function buildArticleGroups(articles: NewsArticle[]): NewsArticleGroup[] {
  const groups = new Map<string, NewsArticle[]>();

  articles.forEach((article) => {
    const key = getArticleGroupId(article);
    const current = groups.get(key) || [];
    current.push(article);
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .map(([groupId, variants]) => {
      const sortedVariants = [...variants].sort(sortArticles);
      const canonical =
        sortedVariants.find((article) => article.id === groupId)
        || sortedVariants.find((article) => !article.translationOfId)
        || sortedVariants[0];

      const availableLanguages = Array.from(
        new Set(
          sortedVariants
            .map(normalizeArticleLanguage)
            .filter((language): language is BlogLanguage => language === "pt" || language === "en")
        )
      );

      return {
        groupId,
        canonicalId: canonical.id,
        variants: sortedVariants,
        availableLanguages,
        hasTranslation: availableLanguages.length > 1,
      } satisfies NewsArticleGroup;
    })
    .sort((a, b) => sortArticles(a.variants[0], b.variants[0]));
}

export function pickPreferredVariant(
  group: NewsArticleGroup,
  preferredLanguage: BlogLanguageFilter,
  fallbackLanguage: BlogLanguage = "pt"
): NewsArticle {
  const languagesToTry = preferredLanguage === "all"
    ? [fallbackLanguage]
    : [preferredLanguage, fallbackLanguage, fallbackLanguage === "pt" ? "en" : "pt"];

  for (const language of languagesToTry) {
    const match = group.variants.find((article) => normalizeArticleLanguage(article) === language);
    if (match) return match;
  }

  return group.variants.find((article) => !article.translationOfId) || group.variants[0];
}

export function findTranslationVariant(
  group: NewsArticleGroup,
  currentArticleId: string,
  targetLanguage?: BlogLanguage
): NewsArticle | null {
  const current = group.variants.find((article) => article.id === currentArticleId) || group.variants[0];
  const currentLanguage = normalizeArticleLanguage(current);

  if (targetLanguage) {
    return group.variants.find((article) => normalizeArticleLanguage(article) === targetLanguage) || null;
  }

  if (currentLanguage === "pt") {
    return group.variants.find((article) => normalizeArticleLanguage(article) === "en") || null;
  }

  if (currentLanguage === "en") {
    return group.variants.find((article) => normalizeArticleLanguage(article) === "pt") || null;
  }

  return group.variants.find((article) => article.id !== current.id) || null;
}

export function articleMatchesSearch(group: NewsArticleGroup, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;

  return group.variants.some((article) => {
    const haystacks = [
      article.title,
      article.excerpt,
      article.content,
      article.tags?.join(" "),
    ].filter(Boolean);

    return haystacks.some((value) => String(value).toLowerCase().includes(term));
  });
}

export function groupMatchesLanguage(group: NewsArticleGroup, language: BlogLanguageFilter): boolean {
  if (language === "all") return true;
  return group.variants.some((article) => normalizeArticleLanguage(article) === language);
}
