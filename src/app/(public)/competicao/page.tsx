import { redirect } from "next/navigation";
import { DEFAULT_COMPETITION_SLUG, fetchPublicCompetitions } from "@/lib/competition-public";

export default async function CompeticaoIndexPage() {
  const competitions = await fetchPublicCompetitions();

  if (competitions.length === 0) {
    redirect("/");
  }

  const preferred = competitions.find((c) => c.slug === DEFAULT_COMPETITION_SLUG);
  const target = preferred || competitions[0];

  redirect(`/competicao/${target.slug}`);
}
