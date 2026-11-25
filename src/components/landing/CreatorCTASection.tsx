"use client";
import Link from "next/link";
import { ArrowRight, BarChart3, MessageCircle, Radio, Tv2 } from "lucide-react";
import { useLang } from "@/lib/lang";

export default function CreatorCTASection() {
 const {lang}=useLang(); const pt=lang==='pt';
 const items=pt ? [
  {icon:Radio,title:'Transmissões',desc:'Organiza o teu conteúdo num só lugar.'},
  {icon:MessageCircle,title:'Comunidade',desc:'Interage com os espectadores durante as lives.'},
  {icon:BarChart3,title:'Análises',desc:'Acompanha o desempenho do teu canal.'},
 ] : [
  {icon:Radio,title:'Streams',desc:'Organise your content in one place.'},
  {icon:MessageCircle,title:'Community',desc:'Interact with viewers during streams.'},
  {icon:BarChart3,title:'Analytics',desc:'Follow your channel performance.'},
 ];
 return <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111116] p-6 sm:p-10 lg:p-12"><div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-red-600/10 blur-3xl"/><div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16"><div><p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-red-400"><Tv2 className="h-4 w-4"/>Creator Studio</p><h2 className="max-w-lg text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">{pt?'A tua paixão. A tua comunidade.':'Your passion. Your community.'}</h2><p className="mt-4 max-w-lg text-sm leading-7 text-gray-300 sm:text-base">{pt?'Partilha conteúdo desportivo e aproxima-te de quem vive o jogo contigo.':'Share sports content and connect with people who love the game.'}</p><Link href="/creator" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">{pt?'Explorar o Creator Studio':'Explore Creator Studio'}<ArrowRight className="h-4 w-4"/></Link></div><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">{items.map(({icon:Icon,title,desc})=><div key={title} className="rounded-2xl border border-white/[.08] bg-white/[.035] p-5"><span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Icon className="h-5 w-5"/></span><h3 className="font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-400">{desc}</p></div>)}</div></div></div></section>;
}
