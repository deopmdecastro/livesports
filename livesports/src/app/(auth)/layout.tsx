import Link from "next/link";
import { Tv2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-[#1A1A1A]">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-[#E50914] rounded p-1">
            <Tv2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[#E50914] font-black text-sm leading-none block">LIVE</span>
            <span className="text-white font-black text-sm leading-none block">SPORTS</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-[#E50914] text-white text-sm font-bold rounded-lg hover:bg-[#B00000] transition-colors"
          >
            Registar
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
