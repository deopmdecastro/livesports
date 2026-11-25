import type { Metadata } from "next";
import CompetitionsHubClient from "@/components/competitions/CompetitionsHubClient";
import { fetchPublicCompetitions } from "@/lib/competition-public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Competições, Classificações & Tabelas de Grupos | LiveSports",
  description:
    "Acompanhe em tempo real todas as competições desportivas, tabelas de classificação das ligas, fases de grupos da Copa do Mundo, Champions League, Libertadores, NBA e Fórmula 1.",
};

export default async function CompeticaoIndexPage() {
  const competitions = await fetchPublicCompetitions();
  return <CompetitionsHubClient initialCompetitions={competitions} />;
}
