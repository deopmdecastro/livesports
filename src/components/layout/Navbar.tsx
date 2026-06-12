"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Search,
  Menu,
  X,
  Bell,
  ChevronDown,
  Tv2,
} from "lucide-react";
import { cn } from "@/utils";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Futebol", href: "/futebol" },
  { label: "Basquete", href: "/basquete" },
  { label: "Tênis", href: "/tenis" },
  { label: "Vôlei", href: "/volei" },
  { label: "UFC", href: "/ufc" },
  { label: "F1", href: "/f1" },
];

const moreLinks = [
  { label: "Beisebol", href: "/beisebol" },
  { label: "Natação", href: "/natacao" },
  { label: "Ciclismo", href: "/ciclismo" },
  { label: "Atletismo", href: "/atletismo" },
  { label: "Golfe", href: "/golfe" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-md shadow-lg border-b border-[#1A1A1A]"
          : "bg-gradient-to-b from-[#0A0A0A] to-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="bg-[#E50914] rounded p-1">
                <Tv2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[#E50914] font-black text-sm leading-none block font-heading">
                  LIVE
                </span>
                <span className="text-white font-black text-sm leading-none block font-heading">
                  SPORTS
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#E50914] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Mais
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    moreOpen && "rotate-180"
                  )}
                />
              </button>
              {moreOpen && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl overflow-hidden">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-colors"
                      onClick={() => setMoreOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center">
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-sm text-white placeholder-gray-400 outline-none w-32 lg:w-48"
                    autoFocus
                  />
                  <button onClick={() => setSearchOpen(false)}>
                    <X className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1A1A1A]"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1A1A1A] hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E50914] rounded-full" />
            </button>

            {/* Auth Buttons */}
            <Link
              href="/login"
              className="hidden sm:block px-4 py-2 text-sm font-semibold text-white border border-[#2A2A2A] rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-bold bg-[#E50914] text-white rounded-lg hover:bg-[#B00000] transition-all shadow-red"
            >
              Registar
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-t border-[#1A1A1A] px-4 py-4">
          <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 mb-4">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar jogos, ligas..."
              className="bg-transparent text-sm text-white placeholder-gray-400 outline-none flex-1"
            />
          </div>
          <nav className="space-y-1">
            {[...navLinks, ...moreLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#1A1A1A] flex gap-2">
              <Link
                href="/login"
                className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white border border-[#2A2A2A] rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center px-4 py-2.5 text-sm font-bold bg-[#E50914] text-white rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                Registar
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
