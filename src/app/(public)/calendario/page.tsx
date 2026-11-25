import type { Metadata } from "next";
import SportsCalendar from "@/components/calendar/SportsCalendar";

export const metadata: Metadata = {
  title: "Calendário Desportivo | LiveSports",
  description:
    "Consulte o calendário de jogos, ligas e competições do dia. Futebol, basquete, ténis, UFC, F1 e muito mais via TheSportsDB.",
};

export default function CalendarPage() {
  return (
    <div className="pb-8">
      <SportsCalendar initialSport="Soccer" />
    </div>
  );
}
