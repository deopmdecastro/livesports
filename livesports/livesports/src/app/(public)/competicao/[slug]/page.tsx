import type { Metadata } from "next";
import { CompetitionPublicView, getCompetitionMetadata } from "@/components/landing/CompetitionPublicView";
import { fetchPublicCompetition } from "@/lib/competition-public";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return getCompetitionMetadata(slug);
}

export default async function CompetitionSlugPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchPublicCompetition(slug);

  return <CompetitionPublicView slug={slug} data={data} />;
}
