import Link from "next/link";
import { Tv2, ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#060609] flex flex-col">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Header */}
      <header className="relative p-4 flex items-center justify-between border-b border-[#15151A]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-lg p-1.5 shadow-[0_0_12px_rgba(229,9,20,0.2)] group-hover:shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all">
            <Tv2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[#E50914] font-black text-sm leading-none block">LIVE</span>
            <span className="text-white font-black text-sm leading-none block">SPORTS</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao site
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center p-4 py-12">
        {children}
      </div>
    </div>
  );
}