"use client";

import Link from "next/link";
import { Zap, Facebook, Twitter, Instagram, Youtube, Mail, Globe } from "lucide-react";
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
          </div>
        </div>
      </div>
    </footer>
  );
}
