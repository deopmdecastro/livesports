import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import LiveNowSection from "@/components/landing/LiveNowSection";
import SportCategoriesSection from "@/components/landing/SportCategoriesSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import AdSlot from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "Live Sports - Transmissões Desportivas ao Vivo",
  description:
    "Assista aos melhores jogos ao vivo! Futebol, Basquete, Tênis e muito mais. Transmissões de alta qualidade 24h por dia.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LiveNowSection />
      <section className="mx-auto grid max-w-[1400px] gap-4 px-4 lg:grid-cols-[1fr_320px] lg:px-6">
        <AdSlot position="in_content" />
        <AdSlot position="sidebar" variant="box" />
      </section>
      <SportCategoriesSection />
      <BenefitsSection />
    </>
  );
}
