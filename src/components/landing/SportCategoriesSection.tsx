"use client";

import Link from "next/link";
import { sportCategories } from "@/lib/mock-data";

export default function SportCategoriesSection() {
  return (
    <section className="py-8 lg:py-12 border-t border-[#1A1A1A]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-[#E50914] rounded-full" />
          <h2 className="text-xl lg:text-2xl font-bold font-heading">Principais Desportos</h2>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {sportCategories.map((sport) => (
            <Link
              key={sport.id}
              href={`/${sport.id === 'football' ? 'futebol' : sport.id === 'basketball' ? 'basquete' : sport.id === 'tennis' ? 'tenis' : sport.id === 'volleyball' ? 'volei' : sport.id === 'f1' ? 'f1' : sport.id === 'baseball' ? 'beisebol' : sport.id === 'other' ? 'outros' : sport.id}`}
              className="group flex flex-col items-center gap-2 p-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-[#E50914]/50 hover:bg-[#E50914]/5 transition-all cursor-pointer"
            >
              <div className="text-3xl">{sport.icon}</div>
              <span className="text-xs font-medium text-gray-300 group-hover:text-white text-center leading-tight">
                {sport.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
