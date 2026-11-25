import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import SportQuickStrip from "@/components/landing/SportQuickStrip";
import LiveNowSection from "@/components/landing/LiveNowSection";
import FreeChannelsSection from "@/components/landing/FreeChannelsSection";
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
    "Descobre jogos, competições, notícias e transmissões desportivas disponíveis no LiveSports.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SportQuickStrip />
      <LiveNowSection />
      <FreeChannelsSection />

      {/* Publicidade Oficial & Banner Promocional */}
      <section className="mx-auto grid max-w-[1400px] gap-4 px-4 py-4 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-4">
          <AdSlot hideWhenEmpty position="in_content" />
          <PromoBannerStrip position="in_content" />
        </div>
        <div className="space-y-4">
          <AdSlot hideWhenEmpty position="sidebar" variant="box" />
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
