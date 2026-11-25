import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import SportQuickStrip from "@/components/landing/SportQuickStrip";
import LiveNowSection from "@/components/landing/LiveNowSection";
import LatestNewsSection from "@/components/landing/LatestNewsSection";
import SportCategoriesSection from "@/components/landing/SportCategoriesSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import WorldCupSection from "@/components/landing/WorldCupSection";
import LeaguesSection from "@/components/landing/LeaguesSection";
import CreatorCTASection from "@/components/landing/CreatorCTASection";
import AdSlot from "@/components/ads/AdSlot";
import PromoBannerStrip from "@/components/ads/PromoBannerStrip";

export const metadata: Metadata = {
  title: "LiveSports – Transmissões ao Vivo | UEFA Champions League, NBA, F1 & Notícias",
  description:
    "Assista aos melhores jogos em direto! UEFA Champions League, Premier League, Liga Portugal, NBA, UFC, Fórmula 1 e últimas notícias desportivas verificadas 24h por dia.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SportQuickStrip />
      <LiveNowSection />

      {/* Publicidade Oficial & Banner Promocional */}
      <section className="mx-auto grid max-w-[1400px] gap-4 px-4 py-4 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-4">
          <AdSlot position="in_content" />
          <PromoBannerStrip position="in_content" />
        </div>
        <div className="space-y-4">
          <AdSlot position="sidebar" variant="box" />
          <PromoBannerStrip position="sidebar" />
        </div>
      </section>

      <LatestNewsSection />
      <LeaguesSection />
      <WorldCupSection />
      <SportCategoriesSection />
      <CreatorCTASection />
      <BenefitsSection />
    </>
  );
}
