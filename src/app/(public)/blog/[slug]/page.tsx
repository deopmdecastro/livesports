import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleClient from "@/components/blog/ArticleClient";
import { serverApiRequest } from "@/lib/server-api";
import { buildArticleGroups } from "@/lib/blog";
import { mockNews } from "@/lib/mock-data";
import type { NewsArticle } from "@/types";
import type { ApiListResponse } from "@/lib/api";

interface TranslationResponse {
  groupId: string;
  items: NewsArticle[];
}

async function loadArticle(slug: string): Promise<{ article: NewsArticle; translations: NewsArticle[]; related: NewsArticle[] } | null> {
  const article = await serverApiRequest<NewsArticle>(`/news/${slug}`);

  if (article) {
    const translationsData = await serverApiRequest<TranslationResponse>(`/news/${slug}/translations`);
    const translations = translationsData?.items?.length ? translationsData.items : [article];

    const relatedData = await serverApiRequest<ApiListResponse<NewsArticle>>(`/news?limit=20${article.sport ? `&sport=${article.sport}` : ""}`);
    const related = (relatedData?.items || []).filter((item) => !translations.some((variant) => variant.id === item.id));

    return { article, translations, related };
  }

  const fallbackArticle = mockNews.find((item) => item.slug === slug);
  if (!fallbackArticle) return null;

  const fallbackGroup = buildArticleGroups(mockNews).find((group) => group.variants.some((item) => item.slug === slug));
  const fallbackTranslations = fallbackGroup?.variants || [fallbackArticle];
  const fallbackRelated = mockNews.filter(
    (item) => item.slug !== slug && (item.sport || "other") === (fallbackArticle.sport || "other")
  );

  return {
    article: fallbackArticle,
    translations: fallbackTranslations,
    related: fallbackRelated,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadArticle(slug);

  if (!data) {
    return {
      title: "Artigo não encontrado | Blog LiveSports",
    };
  }

  return {
    title: `${data.article.title} | Blog LiveSports`,
    description: data.article.excerpt || "Leia a cobertura completa no Blog LiveSports.",
    openGraph: {
      title: data.article.title,
      description: data.article.excerpt || "Leia a cobertura completa no Blog LiveSports.",
      images: data.article.thumbnail ? [data.article.thumbnail] : undefined,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadArticle(slug);

  if (!data) notFound();

  return (
    <ArticleClient
      article={data.article}
      translations={data.translations}
      related={data.related}
    />
  );
}
