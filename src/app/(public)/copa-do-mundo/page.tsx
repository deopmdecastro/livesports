import type { Metadata } from "next";
import WorldCupSection from "@/components/landing/WorldCupSection";
import AdSlot from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "Copa do Mundo FIFA 2026 | World Cup 2026 – LiveSports",
  description:
    "Acompanhe todos os jogos da Copa do Mundo FIFA 2026 ao vivo! EUA, Canadá e México. 48 seleções, 104 jogos. Watch all FIFA World Cup 2026 matches live!",
};

export default function WorldCupPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060609] via-[#0A0A10] to-[#060609]" />
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFD700]/5 blur-[100px] rounded-full" />

        <div className="relative mx-auto max-w-[1400px] px-4 lg:px-6 text-center">
          <div className="inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-full border border-[#FFD700]/25 bg-[#FFD700]/5 text-[#FFD700] text-sm font-bold mb-6">
            <span className="text-2xl">🏆</span>
            FIFA World Cup 2026
          </div>
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            COPA DO MUNDO
            <span className="block gradient-text-red">FIFA 2026</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            O maior espetáculo do futebol mundial. 48 seleções, 104 jogos ao vivo,
            transmitidos em HD com múltiplos servidores. EUA · Canadá · México.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>48</span>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Seleções</span>
            </div>
            <div className="h-8 w-px bg-[#1E1E2A]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>104</span>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Jogos</span>
            </div>
            <div className="h-8 w-px bg-[#1E1E2A]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>3</span>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Países Sede</span>
            </div>
            <div className="h-8 w-px bg-[#1E1E2A]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>16</span>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Estádios</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ad */}
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 mb-4">
        <AdSlot position="in_content" />
      </div>

      {/* World Cup Content */}
      <WorldCupSection />

      {/* Bottom ad */}
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-8">
        <AdSlot position="footer" />
      </div>
    </div>
  );
}
