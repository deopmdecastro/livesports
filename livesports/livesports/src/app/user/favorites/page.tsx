"use client";

import Link from "next/link";
import { Heart, Radio, Play, RefreshCw } from "lucide-react";

export default function UserFavoritesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Heart className="w-6 h-6 text-pink-500" /> Favoritos
        </h1>
        <p className="text-sm text-gray-400 mt-1">As tuas lives e eventos favoritos</p>
      </div>
      <div className="py-20 text-center rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
        <Heart className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <p className="text-base font-bold text-gray-500">Ainda não tens favoritos</p>
        <p className="text-sm text-gray-600 mt-1 mb-5">Adiciona lives e eventos aos favoritos durante as transmissões</p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E50914] hover:bg-[#B00000] text-white font-bold rounded-xl text-sm transition-colors">
          <Play className="w-4 h-4" /> Explorar Lives
        </Link>
      </div>
    </div>
  );
}
