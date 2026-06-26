"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap, Facebook, Twitter, Instagram, Youtube, Mail, Globe, Send, CheckCircle } from "lucide-react";
import { useLang } from "@/lib/lang";

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "X / Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
  const { lang, setLang, t } = useLang();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubscribed(true);
    setSubscribing(false);
  };

  const footerLinks = {
    sports: [
      { label: t.nav_football,    href: "/futebol" },
      { label: t.nav_basketball,  href: "/basquete" },
      { label: t.nav_tennis,      href: "/tenis" },
      { label: t.nav_ufc,         href: "/ufc" },
      { label: "Fórmula 1",       href: "/f1" },
      { label: t.nav_volleyball,  href: "/volei" },
      { label: t.nav_worldcup,    href: "/copa-do-mundo" },
    ],
    company: [
      { label: t.footer_about,    href: "/about" },
      { label: t.footer_careers,  href: "/careers" },
      { label: t.footer_blog,     href: "/blog" },
      { label: t.footer_press,    href: "/press" },
      { label: t.footer_partners, href: "/partners" },
    ],
    support: [
      { label: t.footer_help,     href: "/help" },
      { label: t.footer_contact,  href: "/contact" },
      { label: t.footer_plans,    href: "/plans" },
      { label: t.footer_faq,      href: "/faq" },
    ],
    legal: [
      { label: t.footer_terms,    href: "/terms" },
      { label: t.footer_privacy,  href: "/privacy" },
      { label: t.footer_cookies,  href: "/cookies" },
      { label: t.footer_dmca,     href: "/dmca" },
    ],
  };

  return (
    <footer className="bg-[#060609] border-t border-[#1E1E2A] mt-auto relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#E50914]/3 blur-[80px] rounded-full pointer-events-none" />

      {/* Newsletter Banner */}
      <div className="relative border-b border-[#1E1E2A]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-black text-white mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {lang === "pt" ? "🔔 Receba alertas de jogos ao vivo" : "🔔 Get live match alerts"}
              </h3>
              <p className="text-sm text-gray-500">
                {lang === "pt"
                  ? "Notificações dos melhores jogos diretamente no seu email"
                  : "Get notified about the best games directly in your inbox"}
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
              {subscribed ? (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  {lang === "pt" ? "Inscrito com sucesso!" : "Successfully subscribed!"}
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lang === "pt" ? "Seu email..." : "Your email..."}
                    required
                    className="flex-1 md:w-64 bg-[#111118] border border-[#1E1E2A] focus:border-[#E50914]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E50914] to-[#B00000] text-white text-sm font-bold rounded-xl hover:from-[#FF1A24] hover:to-[#E50914] transition-all shadow-red disabled:opacity-70"
                  >
                    {subscribing ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {lang === "pt" ? "Inscrever" : "Subscribe"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 lg:px-6 py-14">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-xl p-2 group-hover:shadow-red transition-all">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className="gradient-text-red font-black text-lg"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
                >
                  LIVE
                </span>
                <span
                  className="text-white font-black text-lg tracking-widest"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  SPORTS
                </span>
              </div>
            </Link>

            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-[280px]">
              {t.footer_tagline}
            </p>

            {/* Live Status Indicator */}
            <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl bg-[#E50914]/8 border border-[#E50914]/15 w-fit">
              <span className="live-badge h-2 w-2 rounded-full bg-[#E50914]" />
              <span className="text-xs font-bold text-[#E50914]">
                {lang === "pt" ? "Transmissões ao vivo disponíveis" : "Live streams available"}
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 mb-6">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl border border-[#1E1E2A] bg-[#0E0E16] flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#E50914] hover:border-[#E50914] transition-all group"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-600" />
              <div className="flex gap-1">
                <button
                  onClick={() => setLang("pt")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    lang === "pt"
                      ? "bg-[#E50914] text-white"
                      : "text-gray-500 hover:text-white border border-[#1E1E2A] hover:border-[#E50914]/30"
                  }`}
                >
                  PT
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    lang === "en"
                      ? "bg-[#E50914] text-white"
                      : "text-gray-500 hover:text-white border border-[#1E1E2A] hover:border-[#E50914]/30"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">{t.footer_sports}</h4>
            <ul className="space-y-2.5">
              {footerLinks.sports.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-white text-sm transition-colors hover-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">{t.footer_company}</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-white text-sm transition-colors hover-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">{t.footer_support}</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-white text-sm transition-colors hover-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">{t.footer_legal}</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-white text-sm transition-colors hover-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#1E1E2A] to-transparent mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © 2026 LiveSports. {t.footer_rights}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-xs">{t.footer_made_with}</span>
            {/* App store badges */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-700 border border-[#1E1E2A] rounded-lg px-2 py-1 font-medium">App Store</span>
              <span className="text-[10px] text-gray-700 border border-[#1E1E2A] rounded-lg px-2 py-1 font-medium">Google Play</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
