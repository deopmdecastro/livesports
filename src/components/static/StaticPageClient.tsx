"use client";

import { useLang } from "@/lib/lang";
import { getStaticPageContent, type StaticPageSlug } from "@/lib/static-pages-content";
import StaticPageContentView from "./StaticPageContentView";

export default function StaticPageClient({ slug }: { slug: StaticPageSlug }) {
  const { lang } = useLang();
  const content = getStaticPageContent(slug, lang);
  return <StaticPageContentView content={content} />;
}
