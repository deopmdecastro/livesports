"use client";

import Link from "next/link";
import { Tv2, Radio, BarChart3, Users, ArrowRight, CheckCircle } from "lucide-react";
import { usePlatformStats, formatCompactPlus } from "@/hooks/usePlatformStats";

const benefits = [
  "Dashboard de analíticas em tempo real",
  "Chat ao vivo com os teus espectadores",
  "Sondagens interativas durante as transmissões",
  "Estatísticas de crescimento do canal",
  "Suporte prioritário",
];

const steps = [
  { icon: Users, label: "Cria conta", desc: "Regista-te na plataforma" },
  { icon: Tv2, label: "Cria canal", desc: "Configura o teu canal" },
  { icon: Radio, label: "Transmite", desc: "Vai ao ar em minutos" },
  { icon: BarChart3, label: "Cresce", desc: "Analisa e melhora" },
];

export default function CreatorCTASection() {
  const platform = usePlatformStats();

  const platformStats = [
    { label: "Transmissões", value: platform ? formatCompactPlus(platform.totalLives) : "—" },
    { label: "Espectadores", value: platform ? formatCompactPlus(platform.totalViews) : "—" },
    { label: "Online agora", value: platform ? formatCompactPlus(platform.onlineViewers) : "—" },
  ];

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/8 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50914]/5 rounded-full blur-3xl" />

      <div className="relative max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E50914]/30 bg-[#E50914]/10 px-3 py-1.5 text-xs font-bold text-[#E50914] mb-6">
              <Tv2 className="h-3.5 w-3.5" /> CREATOR STUDIO
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-4">
              Transmite o teu conteúdo<br />
              <span className="gradient-text-red">para o mundo inteiro</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Junta-te a centenas de criadores que já transmitem desporto ao vivo na nossa plataforma.
              Ferramentas profissionais, audiência real, sem complicações.
            </p>

            <ul className="space-y-2.5 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/creator"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#E50914] px-6 py-3 text-sm font-bold text-white hover:bg-[#B00000] transition-all shadow-[0_0_20px_rgba(229,9,20,0.3)] hover:shadow-[0_0_30px_rgba(229,9,20,0.5)]">
                <Tv2 className="h-4 w-4" />
                Começar a transmitir
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/creator/analytics"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#111118] px-6 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:border-[#E50914]/30 transition-all">
                <BarChart3 className="h-4 w-4" />
                Ver analíticas
              </Link>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {steps.map(({ icon: Icon, label, desc }, i) => (
                <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 relative overflow-hidden group hover:border-[#E50914]/20 transition-all">
                  <div className="absolute top-3 right-3 text-[#1E1E2A] font-black text-3xl select-none group-hover:text-[#E50914]/10 transition-colors">
                    {i + 1}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#E50914]/10 flex items-center justify-center mb-3">
                    <Icon className="h-4 w-4 text-[#E50914]" />
                  </div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400">PLATAFORMA ATIVA</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {platformStats.map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-xl font-black text-white">{value}</p>
                    <p className="text-[10px] text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
