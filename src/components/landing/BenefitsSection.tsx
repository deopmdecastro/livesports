"use client";
import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, Smartphone } from "lucide-react";
import { useLang } from "@/lib/lang";

export default function BenefitsSection() {
 const {lang}=useLang();const pt=lang==='pt';
 const items=pt ? [
  {icon:CalendarDays,title:'Tudo num só calendário',desc:'Encontra eventos e acompanha as competições que te interessam.'},
  {icon:Smartphone,title:'Em qualquer ecrã',desc:'Consulta o LiveSports no telemóvel, tablet ou computador.'},
  {icon:Bell,title:'Alertas à tua medida',desc:'Escolhe as notificações que queres receber nos dispositivos compatíveis.'},
 ] : [
  {icon:CalendarDays,title:'One calendar',desc:'Find events and follow the competitions that matter to you.'},
  {icon:Smartphone,title:'On your screens',desc:'Explore LiveSports on your phone, tablet or computer.'},
  {icon:Bell,title:'Your alerts',desc:'Choose the notifications you want on compatible devices.'},
 ];
 return <section className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24"><div className="border-t border-white/10 pt-10 lg:pt-14"><div className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-red-400">LiveSports</p><h2 className="text-2xl font-black text-white sm:text-3xl">{pt?'O desporto, mais perto de ti':'Sport, closer to you'}</h2></div><div className="grid gap-3 md:grid-cols-3">{items.map(({icon:Icon,title,desc})=><div key={title} className="rounded-2xl border border-white/10 bg-[#101118] p-5 sm:p-6"><Icon className="mb-5 h-5 w-5 text-red-400"/><h3 className="mb-2 font-bold text-white">{title}</h3><p className="text-sm leading-6 text-gray-400">{desc}</p></div>)}</div><div className="relative mt-8 overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-[#491218] via-[#1c1015] to-[#101118] p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-8"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-red-300">{pt?'Pronto para começar?':'Ready to start?'}</p><h2 className="text-2xl font-black text-white sm:text-3xl">{pt?'Acompanha o que te apaixona.':'Follow what you love.'}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-gray-300">{pt?'Cria a tua conta para explorar eventos e personalizar a tua experiência.':'Create an account to explore events and personalise your experience.'}</p></div><Link href="/register" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[#1b1113] transition hover:bg-gray-200 lg:mt-0">{pt?'Criar conta':'Create account'}<ArrowRight className="h-4 w-4"/></Link></div></div></section>;
}
