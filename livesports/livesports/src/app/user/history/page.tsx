"use client";

import Link from "next/link";
import { Clock, Play } from "lucide-react";

export default function UserHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-400" /> Histórico
        </h1>
        <p className="text-sm text-gray-400 mt-1">O teu histórico de visualizações</p>
      </div>
      <div className="py-20 text-center rounded-xl border border-[#1E1E2A] bg-[#0E0E16]">
        <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <p className="text-base font-bold text-gray-500">Histórico vazio</p>
        <p className="text-sm text-gray-600 mt-1 mb-5">As lives que vires aparecerão aqui</p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E50914] hover:bg-[#B00000] text-white font-bold rounded-xl text-sm transition-colors">
          <Play className="w-4 h-4" /> Ir para Lives
        </Link>
      </div>
    </div>
  );
}
