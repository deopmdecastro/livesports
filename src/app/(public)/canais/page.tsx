import type { Metadata } from "next";
import FreeChannelsGuideClient from "@/components/channels/FreeChannelsGuideClient";

export const metadata: Metadata = {
  title: "Canais de Desporto Gratuitos 24/7 & Lives em Direto | LiveSports",
  description:
    "Assista gratuitamente a mais de 22 canais de desporto em sinal aberto 24h por dia: FIFA+ Portugal, beIN SPORTS XTRA, Red Bull TV, FITE Combat, GLORY, Overtime, Tennis Channel e mais.",
};

export default function FreeChannelsPage() {
  return <FreeChannelsGuideClient />;
}
