import type { Metadata } from "next";
import SportsCalendar from "@/components/calendar/SportsCalendar";

export const metadata: Metadata = {
  title: "Calendario Desportivo | LiveSports",
  description:
    "Consulte o calendario de jogos, ligas e competicoes do dia. Futebol, basquete, tenis, UFC, F1 e muito mais via TheSportsDB.",
};

export default function CalendarPage() {
  return <SportsCalendar initialSport="Soccer" />;
}
