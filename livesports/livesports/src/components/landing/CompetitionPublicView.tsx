import type { Metadata } from "next";
import WorldCupSection from "@/components/landing/WorldCupSection";
import WorldCupHero from "@/components/landing/WorldCupHero";
import AdSlot from "@/components/ads/AdSlot";
import { fetchPublicCompetition } from "@/lib/competition-public";
import type { PublicCompetitionPage } from "@/types";

interface Props {
  slug: string;
  data: PublicCompetitionPage | null;
}

export function CompetitionPublicView({ slug, data }: Props) {
  return (
    <div className="min-h-screen">
      {data?.competition ? <WorldCupHero competition={data.competition} /> : null}

      <WorldCupSection slug={slug} initialData={data} showTopAd />

      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-8">
        <AdSlot position="footer" />
      </div>
    </div>
  );
}

export async function getCompetitionMetadata(slug: string): Promise<Metadata> {
  const data = await fetchPublicCompetition(slug);
  const title = data?.competition.sectionTitle || data?.competition.name || slug;

  return {
    title: `${title} | LiveSports`,
    description:
      data?.competition.heroDescription ||
      data?.competition.description ||
      `Acompanhe ${title} ao vivo na LiveSports.`,
  };
}
