import type { MetadataRoute } from "next";
import { fetchPublicCompetitions } from "@/lib/competition-public";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://livesports.com").replace(/\/$/, "");
  const competitions = await fetchPublicCompetitions();
  return ["", "/competicao", "/calendario", "/canais", "/blog"].map(path => ({ url: `${base}${path}` }))
    .concat(competitions.map(c => ({ url: `${base}/competicao/${encodeURIComponent(c.slug)}` })));
}
