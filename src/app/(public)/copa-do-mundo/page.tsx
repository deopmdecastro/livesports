import type { Metadata } from "next";
import { CompetitionPublicView, getCompetitionMetadata } from "@/components/landing/CompetitionPublicView";
import { DEFAULT_COMPETITION_SLUG, fetchPublicCompetition } from "@/lib/competition-public";

export async function generateMetadata(): Promise<Metadata> {
  return getCompetitionMetadata(DEFAULT_COMPETITION_SLUG);
}

export default async function WorldCupPage() {
  const data = await fetchPublicCompetition(DEFAULT_COMPETITION_SLUG);

  return <CompetitionPublicView slug={DEFAULT_COMPETITION_SLUG} data={data} />;
}
