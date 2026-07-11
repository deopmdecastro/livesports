"use client";

import Link from "next/link";
import { Monitor, Smartphone, Tv, Wifi, Bell, Shield, Star, Zap, Users, Globe, Clock, Award } from "lucide-react";
import { useLang } from "@/lib/lang";
import { usePlatformStats, formatCompactPlus } from "@/hooks/usePlatformStats";

export default function BenefitsSection() {
  const { lang, t } = useLang();
  const platform = usePlatformStats();

  const benefits = [
    {
      icon: Zap,
      title: t.benefit_hd_title,
      desc: t.benefit_hd_desc,
      color: "#E50914",
      glow: "rgba(229,9,20,0.15)",
    },
    {
      icon: Monitor,
      title: t.benefit_quality_title,
      desc: t.benefit_quality_desc,
      color: "#E50914",
      glow: "rgba(229,9,20,0.12)",
    },
    {
      icon: Smartphone,
      title: t.benefit_multi_title,
      desc: t.benefit_multi_desc,
      color: "#22C55E",
      glow: "rgba(34,197,94,0.12)",
    },
    {
      icon: Bell,
      title: t.benefit_notif_title,
      desc: t.benefit_notif_desc,
      color: "#F59E0B",
      glow: "rgba(245,158,11,0.12)",
    },
  ];

  const features = [
    { icon: Wifi, label: t.feat_no_interruption, color: "#22C55E" },
    { icon: Shield, label: t.feat_secure, color: "#E50914" },
    { icon: Star, label: t.feat_premium, color: "#F59E0B" },
    { icon: Tv, label: t.feat_smarttv, color: "#8B5CF6" },
  ];

  const stats = [
    {
      value: platform ? formatCompactPlus(platform.totalLives) : "—",
      label: lang === "pt" ? "Transmissões" : "Live Streams",
      icon: Zap,
    },
    {
      value: platform ? formatCompactPlus(platform.totalUsers) : "—",
      label: lang === "pt" ? "Utilizadores" : "Users",
      icon: Users,
    },
    {
      value: "24/7",
      label: lang === "pt" ? "Disponível" : "Available",
      icon: Clock,
    },
    {
      value: platform ? formatCompactPlus(platform.countries) : "—",
      label: lang === "pt" ? "Países" : "Countries",
      icon: Globe,
    },
  ];

  const liveNow = platform?.liveNow ?? 0;

  return (
    <>
      {/* Stats Bar */}
      <section className="py-8 border-t border-[#1E1E2A]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] hover:border-[#E50914]/25 transition-all">
                <Icon className="h-5 w-5 text-[#E50914] mb-1" />
                <span
                  className="text-3xl font-black gradient-text-red"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {value}
                </span>
                <span className="text-xs text-gray-500 font-medium text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className="py-10 lg:py-14">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-[#1E1E2A] bg-[#0E0E16]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E50914]/8 via-transparent to-transparent" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50914]/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 grid-bg opacity-15" />

            <div className="relative flex flex-col md:flex-row items-center gap-8 p-6 lg:p-10">
              {/* Devices mockup */}
              <div className="flex-shrink-0 w-full md:w-56 lg:w-72 relative">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1593766788306-28561086694e?w=600&q=80"
                    alt="Multi devices"
                    className="w-full h-44 md:h-52 object-cover rounded-2xl opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E16] via-transparent to-transparent rounded-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-l from-[#0E0E16]/50 via-transparent to-transparent rounded-2xl" />
                </div>
                {/* Floating live card */}
                <div className="absolute -bottom-3 -right-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E50914]/30 bg-[#111118]/90 backdrop-blur-sm shadow-red">
                  <span className="live-badge h-2 w-2 rounded-full bg-[#E50914]" />
                  <span className="text-[11px] font-black text-white">
                    {lang === "pt" ? `${liveNow} AO VIVO` : `${liveNow} LIVE NOW`}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914] text-xs font-bold uppercase tracking-wider mb-4">
                  <Award className="h-3 w-3" />
                  {lang === "pt" ? "Premium" : "Premium"}
                </div>
                <h2
                  className="text-2xl lg:text-3xl font-black text-white mb-3"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {t.cta_no_miss}
                </h2>
                <p className="text-gray-400 mb-6 text-sm lg:text-base leading-relaxed max-w-xl">
                  {t.cta_no_miss_sub}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-7 max-w-sm">
                  {features.map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-300">{label}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#E50914] to-[#B00000] text-white font-bold rounded-xl hover:from-[#FF1A24] hover:to-[#E50914] transition-all shadow-red hover:shadow-red-lg"
                >
                  <Zap className="h-4 w-4" />
                  {t.cta_watch}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-10 lg:py-14 border-t border-[#1E1E2A]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-1.5 bg-gradient-to-b from-[#E50914] to-[#B00000] rounded-full" />
            <h2
              className="text-xl lg:text-2xl font-black text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {lang === "pt" ? "Por que usar o LiveSports?" : "Why use LiveSports?"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map(({ icon: Icon, title, desc, color, glow }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-6 card-hover"
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none"
                  style={{ background: glow }}
                />
                <div
                  className="relative w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${color}18`, border: `1px solid ${color}25` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-bold text-white mb-2 text-base">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-10 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="relative overflow-hidden rounded-2xl">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#E50914] via-[#B00000] to-[#7A0000]" />
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-2xl" />

            <div className="relative text-center px-6 py-14 lg:py-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-6">
                <span className="live-badge h-2 w-2 rounded-full bg-white" />
                {lang === "pt" ? "Sem Custo" : "Free Forever"}
              </div>
              <h2
                className="text-3xl lg:text-5xl font-black text-white mb-4 leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {t.cta_title}
              </h2>
              <p className="text-white/75 text-base lg:text-lg mb-10 max-w-xl mx-auto">
                {t.cta_sub}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-3 px-10 py-4 bg-white text-[#E50914] font-black rounded-2xl hover:bg-gray-100 transition-all text-base shadow-2xl hover:scale-105"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                <Zap className="h-5 w-5" />
                {t.cta_btn}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
