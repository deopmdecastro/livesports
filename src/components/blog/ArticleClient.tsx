"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { ArrowLeft, CalendarDays, Globe2, Languages, Sparkles } from "lucide-react";
import { useLang } from "@/lib/lang";
import {
  buildArticleGroups,
  normalizeArticleLanguage,
  pickPreferredVariant,
  type NewsArticleGroup,
} from "@/lib/blog";
import type { NewsArticle } from "@/types";
import { formatDateTime, formatNumber, getSportLabel } from "@/utils";

interface ArticleClientProps {
  article: NewsArticle;
  translations: NewsArticle[];
  related: NewsArticle[];
}

function getPreferredUiLanguage(currentLang: string): "pt" | "en" {
  return currentLang === "en" ? "en" : "pt";
}

function RelatedCard({ group }: { group: NewsArticleGroup }) {
  const { lang } = useLang();
  const article = pickPreferredVariant(group, "all", getPreferredUiLanguage(lang));

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="rounded-2xl border border-white/10 bg-[#111118] p-4 transition-all hover:border-[#E50914]/30"
    >
      <p className="text-xs font-semibold text-[#E50914]">{getSportLabel(article.sport || "other")}</p>
      <h3 className="mt-2 line-clamp-2 text-sm font-bold text-white">{article.title}</h3>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">{article.excerpt || "Leia a cobertura completa no blog LiveSports."}</p>
    </Link>
  );
}

export default function ArticleClient({ article, translations, related }: ArticleClientProps) {
  const { lang } = useLang();
  const uiLang = getPreferredUiLanguage(lang);
  const group = useMemo(() => buildArticleGroups(translations)[0], [translations]);
  const [selectedId, setSelectedId] = useState(article.id);

  useEffect(() => {
    if (!group) return;
    const preferred = pickPreferredVariant(group, "all", uiLang);
    setSelectedId((current) => {
      if (group.variants.some((variant) => variant.id === current)) return current;
      return preferred.id;
    });
  }, [group, uiLang]);

  const current = group?.variants.find((item) => item.id === selectedId) || article;
  const currentLanguage = normalizeArticleLanguage(current);
  const safeHtml = useMemo(
    () => DOMPurify.sanitize(current.content || "", { USE_PROFILES: { html: true } }),
    [current.content]
  );

  const relatedGroups = useMemo(() => buildArticleGroups(related).slice(0, 4), [related]);

  return (
    <section className="px-4 py-8 lg:px-6 lg:py-10">
      <div className="mx-auto max-w-[1100px] space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao blog
          </Link>

          {group?.availableLanguages.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                <Languages className="h-3.5 w-3.5" />
                Tradução
              </span>
              {group.variants.map((variant) => {
                const language = normalizeArticleLanguage(variant) || "orig";
                const active = variant.id === current.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedId(variant.id)}
                    className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${active ? "bg-[#E50914] text-white" : "border border-white/10 bg-white/5 text-white/70 hover:text-white"}`}
                  >
                    {language === "orig" ? "Original" : language}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <article className="overflow-hidden rounded-[30px] border border-white/10 bg-[#111118] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="relative aspect-[16/8] overflow-hidden bg-[#1A1A1A]">
            <img
              src={current.thumbnail || `https://picsum.photos/seed/article-${current.id}/1400/720`}
              alt={current.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#E50914]/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF8C92]">
                  {getSportLabel(current.sport || "other")}
                </span>
                {currentLanguage ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                    {currentLanguage}
                  </span>
                ) : null}
                {group?.availableLanguages.length && group.availableLanguages.length > 1 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
                    <Globe2 className="h-3.5 w-3.5" />
                    Alternar idioma sem duplicar a notícia
                  </span>
                ) : null}
              </div>
              <h1 className="max-w-4xl text-3xl font-black leading-tight text-white lg:text-5xl">{current.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-200 lg:text-base">
                {current.excerpt || "Cobertura editorial completa da equipe LiveSports com opção de tradução para alternar idiomas quando disponível."}
              </p>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="p-6 lg:p-8">
              <div className="mb-8 flex flex-wrap items-center gap-5 border-b border-white/6 pb-5 text-sm text-gray-400">
                <span>{current.author?.name || "Equipa LiveSports"}</span>
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#E50914]" />{formatDateTime(current.publishedAt || current.createdAt)}</span>
                <span>{formatNumber(current.views || 0)} visualizações</span>
              </div>

              <div
                className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-200 prose-a:text-[#FF8C92] prose-strong:text-white"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            </div>

            <aside className="border-l border-white/6 bg-[#0D0D13] p-6 lg:p-8">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#E50914]">
                  <Sparkles className="h-4 w-4" />
                  Resumo rápido
                </div>
                <p className="text-sm leading-7 text-gray-300">
                  Artigo agrupado por idioma. Se existir versão em português e inglês, você pode alternar acima sem voltar para a listagem nem abrir uma notícia duplicada.
                </p>
              </div>

              {(current.tags || []).length ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/65">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {(current.tags || []).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </article>

        {relatedGroups.length ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E50914]">Mais leituras</p>
              <h2 className="text-2xl font-black text-white">Relacionadas</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {relatedGroups.map((relatedGroup) => (
                <RelatedCard key={relatedGroup.groupId} group={relatedGroup} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
