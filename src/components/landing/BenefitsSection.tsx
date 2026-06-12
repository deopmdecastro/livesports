"use client";

import Link from "next/link";
import { Monitor, Smartphone, Tv, Wifi, Bell, Shield, Star, Zap } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Transmissões HD",
    desc: "Cobertura ao vivo dos maiores eventos em HD e Full HD sem travamentos.",
    color: "#E50914",
  },
  {
    icon: Monitor,
    title: "Alta Qualidade",
    desc: "Vídeo em HD e Full HD em todos os seus dispositivos favoritos.",
    color: "#3B82F6",
  },
  {
    icon: Smartphone,
    title: "Multi Dispositivos",
    desc: "Assista no celular, tablet, smart TV ou computador. Em qualquer lugar.",
    color: "#22C55E",
  },
  {
    icon: Bell,
    title: "Notificações",
    desc: "Receba alertas dos jogos e eventos favoritos antes do início.",
    color: "#F59E0B",
  },
];

const features = [
  { icon: Wifi, label: "Sem interrupções" },
  { icon: Shield, label: "100% Seguro" },
  { icon: Star, label: "Qualidade Premium" },
  { icon: Tv, label: "Smart TV" },
];

export default function BenefitsSection() {
  return (
    <>
      {/* Banner CTA */}
      <section className="py-8 lg:py-12">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E50914]/10 to-transparent" />
            <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 lg:p-8">
              {/* Image side */}
              <div className="flex-shrink-0 w-full md:w-64 lg:w-80">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1593766788306-28561086694e?w=400&q=80"
                    alt="Multi devices"
                    className="rounded-xl w-full object-cover h-40 md:h-48"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent rounded-xl" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-2xl lg:text-3xl font-bold font-heading mb-2">
                  Não perca nenhum lance!
                </h2>
                <p className="text-gray-400 mb-4 text-sm lg:text-base">
                  Assista onde quiser, quando quiser. Transmissões em HD, sem travamentos.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {features.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#E50914]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#E50914]" />
                      </div>
                      <span className="text-xs font-medium text-gray-300">{label}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#E50914] text-white font-bold rounded-lg hover:bg-[#B00000] transition-all shadow-red"
                >
                  Registre-se Grátis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="py-8 lg:py-12 border-t border-[#1A1A1A]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#E50914]/30 transition-all card-hover"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-8 lg:py-12">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="bg-gradient-to-r from-[#E50914] to-[#B00000] rounded-2xl p-8 lg:p-12 text-center">
            <h2 className="text-2xl lg:text-4xl font-black font-heading mb-3">
              Pronto para viver a emoção do esporte?
            </h2>
            <p className="text-white/80 text-base lg:text-lg mb-8">
              Crie sua conta gratuita e tenha acesso ilimitado a todos os jogos.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A0A0A] text-white font-bold rounded-xl hover:bg-[#1A1A1A] transition-all text-base shadow-xl"
            >
              CRIAR CONTA GRÁTIS
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
