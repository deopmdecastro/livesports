import Link from "next/link";
import { CalendarClock, Play, Users } from "lucide-react";
import { notFound } from "next/navigation";
import type { Live, SportCategory } from "@/types";
import { formatNumber, getSportLabel } from "@/utils";
import { serverApiRequest } from "@/lib/server-api";
import type { ApiListResponse } from "@/lib/api";

const slugToSport: Record<string, SportCategory | "all-live" | "empty" | "blank"> = {
  "ao-vivo": "all-live",
  futebol: "football",
  basquete: "basketball",
  tenis: "tennis",
  volei: "volleyball",
  ufc: "ufc",
  f1: "f1",
  beisebol: "baseball",
  outros: "other",
  natacao: "empty",
  ciclismo: "empty",
  atletismo: "empty",
  golfe: "empty",
  about: "blank",
  careers: "blank",
  blog: "blank",
  press: "blank",
  partners: "blank",
  help: "blank",
  contact: "blank",
  plans: "blank",
  faq: "blank",
  terms: "blank",
  privacy: "blank",
  cookies: "blank",
  dmca: "blank",
};

const slugLabels: Record<string, string> = {
  "ao-vivo": "Ao Vivo",
  futebol: "Futebol",
  basquete: "Basquete",
  tenis: "Tenis",
  volei: "Volei",
  ufc: "UFC",
  f1: "Formula 1",
  beisebol: "Beisebol",
  outros: "Outros",
  natacao: "Natacao",
  ciclismo: "Ciclismo",
  atletismo: "Atletismo",
  golfe: "Golfe",
  about: "Sobre Nos",
  careers: "Carreiras",
  blog: "Blog",
  press: "Imprensa",
  partners: "Parceiros",
  help: "Central de Ajuda",
  contact: "Contato",
  plans: "Planos",
  faq: "FAQ",
  terms: "Termos de Uso",
  privacy: "Privacidade",
  cookies: "Cookies",
  dmca: "DMCA",
};

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function StreamCard({ live }: { live: Live }) {
  const isLive = live.status === "live";

  return (
    <Link
      href={`/watch/${live.id}`}
      className="group overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] transition-all hover:border-[#E50914]/50"
    >
      <div className="relative aspect-video overflow-hidden bg-[#2A2A2A]">
        <img
          src={live.thumbnail || `https://picsum.photos/seed/${live.id}/640/360`}
          alt={live.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 rounded bg-[#E50914] px-2 py-1 text-xs font-bold text-white">
          {isLive ? "AO VIVO" : "PROGRAMADO"}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E50914]">
            <Play className="ml-0.5 h-5 w-5 fill-current text-white" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="mb-1 text-xs font-semibold text-[#E50914]">{live.league}</p>
        <h2 className="mb-3 text-base font-bold text-white">{live.title}</h2>
        <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
          <span className="font-medium text-gray-300">{getSportLabel(live.sport)}</span>
          {isLive ? (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(live.viewerCount)}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatKickoff(live.scheduledAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function generateStaticParams() {
  return Object.keys(slugToSport).map((slug) => ({ slug }));
}

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = slugToSport[slug];
  if (!category) notFound();

  if (category === "blank") {
    return <section className="min-h-[70vh]" aria-label={slugLabels[slug]} />;
  }

  const liveData =
    category === "empty"
      ? null
      : await serverApiRequest<ApiListResponse<Live>>(
          category === "all-live" ? "/lives?status=live&limit=100" : `/lives?sport=${category}&limit=100`
        );
  const lives = liveData?.items || [];

  const title = slugLabels[slug];

  return (
    <section className="min-h-[70vh] px-4 py-10 lg:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase text-[#E50914]">
            Live Sports
          </p>
          <h1 className="font-heading text-3xl font-black text-white lg:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-400 lg:text-base">
            Transmissoes ao vivo e jogos programados para esta categoria.
          </p>
        </div>

        {lives.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {lives.map((live) => (
              <StreamCard key={live.id} live={live} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-white">
              Nenhuma transmissao disponivel
            </h2>
            <p className="mb-6 text-sm text-gray-400">
              Ainda nao ha jogos cadastrados para esta categoria.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#B00000]"
            >
              Voltar ao inicio
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
