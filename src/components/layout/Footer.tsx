"use client";

import Link from "next/link";
import { Tv2, Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";

const footerLinks = {
  sports: [
    { label: "Futebol", href: "/futebol" },
    { label: "Basquete", href: "/basquete" },
    { label: "Tênis", href: "/tenis" },
    { label: "UFC", href: "/ufc" },
    { label: "Fórmula 1", href: "/f1" },
    { label: "Vôlei", href: "/volei" },
  ],
  company: [
    { label: "Sobre Nós", href: "/about" },
    { label: "Carreiras", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Imprensa", href: "/press" },
    { label: "Parceiros", href: "/partners" },
  ],
  support: [
    { label: "Central de Ajuda", href: "/help" },
    { label: "Contato", href: "/contact" },
    { label: "Planos", href: "/plans" },
    { label: "FAQ", href: "/faq" },
  ],
  legal: [
    { label: "Termos de Uso", href: "/terms" },
    { label: "Privacidade", href: "/privacy" },
    { label: "Cookies", href: "/cookies" },
    { label: "DMCA", href: "/dmca" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter/X" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#1A1A1A] mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-[#E50914] rounded p-1">
                <Tv2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[#E50914] font-black text-sm leading-none block font-heading">LIVE</span>
                <span className="text-white font-black text-sm leading-none block font-heading">SPORTS</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              A melhor plataforma de streaming esportivo ao vivo. 
              Assista futebol, basquete, tênis, UFC e muito mais com qualidade HD.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#E50914] hover:border-[#E50914] transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Desportos</h4>
            <ul className="space-y-2">
              {footerLinks.sports.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Empresa</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Suporte</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Live Sports. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-500 text-xs">
              Feito com ❤️ para os amantes do desporto
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
