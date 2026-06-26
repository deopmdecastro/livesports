import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import LiveNowSection from "@/components/landing/LiveNowSection";
import SportCategoriesSection from "@/components/landing/SportCategoriesSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import WorldCupSection from "@/components/landing/WorldCupSection";
import LeaguesSection from "@/components/landing/LeaguesSection";
import CreatorCTASection from "@/components/landing/CreatorCTASection";
import AdSlot from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "LiveSports – Transmissões ao Vivo | Copa do Mundo 2026 | Live Sports Streams",
  description:
    "Assista aos melhores jogos ao vivo! Copa do Mundo 2026, Futebol, Basquete, Tênis e muito mais. Transmissões em HD 24h por dia. Watch live sports - World Cup 2026, Football, Basketball and more.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LiveNowSection />
      <section className="mx-auto grid max-w-[1400px] gap-4 px-4 py-4 lg:grid-cols-[1fr_320px] lg:px-6">
        <AdSlot position="in_content" />
        <AdSlot position="sidebar" variant="box" />
      </section>
      <WorldCupSection />
      <LeaguesSection />
      <SportCategoriesSection />
      <CreatorCTASection />
      <BenefitsSection />
    </>
  );
}
