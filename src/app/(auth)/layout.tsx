import Link from "next/link";
import { ArrowLeft, Radio, ShieldCheck, Trophy } from "lucide-react";
import BrandIdentity from "@/components/branding/BrandIdentity";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative min-h-[100dvh] overflow-hidden bg-[#07080e]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_5%,rgba(229,9,20,.14),transparent_40%),radial-gradient(ellipse_at_90%_90%,rgba(66,75,121,.12),transparent_40%)]" />
    <header className="relative mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-5 pb-3 pt-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.75rem))] sm:px-10 sm:pb-5">
      <Link href="/" aria-label="LiveSports — início"><BrandIdentity mode="navbar" /></Link>
      <Link href="/" className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-gray-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"><ArrowLeft className="h-4 w-4 shrink-0" />Voltar ao site</Link>
    </header>
    <main className="relative mx-auto grid min-h-[calc(100dvh-90px)] max-w-6xl items-start gap-12 px-5 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-4 sm:items-center sm:px-10 sm:pb-16 sm:pt-6 lg:grid-cols-[1fr_490px] lg:gap-20">
      <aside className="hidden lg:block">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-red-300"><Radio className="h-3.5 w-3.5" /> A emoção do desporto</div>
        <h2 className="mt-6 max-w-lg text-5xl font-black leading-[1.08] tracking-tight text-white">O seu desporto.<br/><span className="text-[#ef2632]">Sempre mais perto.</span></h2>
        <p className="mt-5 max-w-md text-base leading-7 text-gray-400">Acompanhe jogos, competições e transmissões num só lugar. Entre na sua conta para uma experiência mais pessoal.</p>
        <div className="mt-10 grid max-w-md gap-3 text-sm text-gray-300"><p className="flex items-center gap-3"><Trophy className="h-5 w-5 text-red-400" /> Descubra competições e resultados</p><p className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-red-400" /> Aceda à sua conta em qualquer dispositivo</p></div>
        <div className="mt-14 h-1 w-24 rounded-full bg-gradient-to-r from-red-600 to-transparent" />
      </aside>
      <div className="w-full">{children}</div>
    </main>
  </div>;
}
