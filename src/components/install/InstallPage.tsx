"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, CheckCircle2, Globe2, Share, Smartphone, Wifi } from "lucide-react";
import { useInstallApp } from "./InstallProvider";

export default function InstallPage() {
  const { canPrompt, installed, install } = useInstallApp();
  const [ios, setIos] = useState(false);
  useEffect(() => { setIos(/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)); }, []);
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_360px]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300"><Smartphone className="h-3.5 w-3.5" />Aplicação Web</span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">LiveSports no seu telemóvel</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-400">Instale a aplicação web no ecrã inicial e acompanhe jogos, competições e transmissões com acesso rápido.</p>
          <div className="mt-7">
            {installed ? <p role="status" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" />Aplicação já instalada</p> : canPrompt ? <button type="button" onClick={() => void install()} className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-5 py-3 text-sm font-black text-white hover:bg-red-600"><ArrowDownToLine className="h-4 w-4" />Instalar aplicação</button> : <p className="text-sm text-gray-400">Siga as instruções abaixo para adicionar ao ecrã inicial.</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#191b2b] to-[#08090f] p-8 text-center shadow-2xl">
          <img src="/icons/icon-192.png" alt="Ícone da LiveSports" className="mx-auto h-28 w-28 rounded-[28px] shadow-[0_16px_50px_rgba(229,9,20,.25)]" />
          <h2 className="mt-5 text-xl font-black">LiveSports</h2>
          <p className="mt-1 text-sm text-gray-400">Futebol · Basquetebol · Mais</p>
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <article className={`rounded-2xl border p-6 ${ios ? "border-red-500/40 bg-red-500/[.05]" : "border-white/10 bg-white/[.03]"}`}>
          <h2 className="flex items-center gap-2 text-lg font-black"><Share className="h-5 w-5 text-red-400" /> iPhone e iPad</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-300"><li>Abra este site no Safari.</li><li>Toque em <strong>Partilhar</strong> e depois em <strong>Adicionar ao ecrã principal</strong>.</li><li>Confirme em <strong>Adicionar</strong>.</li></ol>
        </article>
        <article className={`rounded-2xl border p-6 ${!ios ? "border-red-500/40 bg-red-500/[.05]" : "border-white/10 bg-white/[.03]"}`}>
          <h2 className="flex items-center gap-2 text-lg font-black"><Globe2 className="h-5 w-5 text-red-400" /> Android</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-300"><li>Abra este site no Chrome.</li><li>Toque em <strong>Instalar aplicação</strong> acima, se disponível, ou abra o menu ⋮ do navegador.</li><li>Escolha <strong>Instalar aplicação</strong> ou <strong>Adicionar ao ecrã inicial</strong>.</li></ol>
        </article>
      </div>
      <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-gray-500"><Wifi className="mt-0.5 h-4 w-4 shrink-0" />A instalação é feita pelo navegador, não pelas lojas. Lives e resultados precisam de ligação à internet. A instalação requer uma ligação segura HTTPS.</p>
    </section>
  );
}
