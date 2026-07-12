"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Public Page Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E50914]/10 border border-[#E50914]/20">
          <AlertTriangle className="h-10 w-10 text-[#E50914]" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Algo correu mal</h1>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Ocorreu um erro ao carregar esta página. Podes tentar novamente ou voltar ao início.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E1E2A] border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-[#2A2A3A] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E50914] px-5 py-3 text-sm font-bold text-white hover:bg-[#B00000] transition-colors"
          >
            <Home className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
