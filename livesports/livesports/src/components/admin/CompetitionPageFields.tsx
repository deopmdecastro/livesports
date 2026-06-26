"use client";

import type { CompetitionFormat } from "@/types";

interface CompetitionPageForm {
  heroBadge: string;
  heroBadgeIcon: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  statTeams: string;
  statGames: string;
  statHostCountries: string;
  statStadiums: string;
  hostCountries: string;
  sectionTitle: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButtonText: string;
  groupsJson: string;
}

interface Props {
  form: CompetitionPageForm;
  format?: CompetitionFormat;
  onChange: (patch: Partial<CompetitionPageForm>) => void;
}

export function competitionPageFormFromData(data: {
  heroBadge?: string;
  heroBadgeIcon?: string;
  heroTitleLine1?: string;
  heroTitleLine2?: string;
  heroDescription?: string;
  statTeams?: number;
  statGames?: number;
  statHostCountries?: number;
  statStadiums?: number;
  hostCountries?: string;
  sectionTitle?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  groupsData?: unknown;
}): CompetitionPageForm {
  return {
    heroBadge: data.heroBadge || "",
    heroBadgeIcon: data.heroBadgeIcon || "🏆",
    heroTitleLine1: data.heroTitleLine1 || "",
    heroTitleLine2: data.heroTitleLine2 || "",
    heroDescription: data.heroDescription || "",
    statTeams: data.statTeams != null ? String(data.statTeams) : "",
    statGames: data.statGames != null ? String(data.statGames) : "",
    statHostCountries: data.statHostCountries != null ? String(data.statHostCountries) : "",
    statStadiums: data.statStadiums != null ? String(data.statStadiums) : "",
    hostCountries: data.hostCountries || "",
    sectionTitle: data.sectionTitle || "",
    ctaTitle: data.ctaTitle || "",
    ctaDescription: data.ctaDescription || "",
    ctaButtonText: data.ctaButtonText || "",
    groupsJson: data.groupsData ? JSON.stringify(data.groupsData, null, 2) : "",
  };
}

export function competitionPagePayload(form: CompetitionPageForm) {
  let groupsData = null;
  if (form.groupsJson.trim()) {
    try {
      groupsData = JSON.parse(form.groupsJson);
    } catch {
      throw new Error("JSON de grupos inválido.");
    }
  }

  return {
    heroBadge: form.heroBadge || null,
    heroBadgeIcon: form.heroBadgeIcon || "🏆",
    heroTitleLine1: form.heroTitleLine1 || null,
    heroTitleLine2: form.heroTitleLine2 || null,
    heroDescription: form.heroDescription || null,
    statTeams: form.statTeams === "" ? 0 : Number(form.statTeams),
    statGames: form.statGames === "" ? 0 : Number(form.statGames),
    statHostCountries: form.statHostCountries === "" ? 0 : Number(form.statHostCountries),
    statStadiums: form.statStadiums === "" ? 0 : Number(form.statStadiums),
    hostCountries: form.hostCountries || null,
    sectionTitle: form.sectionTitle || null,
    ctaTitle: form.ctaTitle || null,
    ctaDescription: form.ctaDescription || null,
    ctaButtonText: form.ctaButtonText || null,
    groupsData,
  };
}

export default function CompetitionPageFields({ form, format = "groups", onChange }: Props) {
  const showStandings = format === "groups" || format === "league";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-white mb-1">Página pública · Hero</h3>
        <p className="text-xs text-gray-500 mb-4">Conteúdo do topo em /copa-do-mundo (ou slug da competição).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Badge</label>
            <input
              value={form.heroBadge}
              onChange={(e) => onChange({ heroBadge: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="FIFA World Cup 2026"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Ícone do badge</label>
            <input
              value={form.heroBadgeIcon}
              onChange={(e) => onChange({ heroBadgeIcon: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="🏆"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Título linha 1</label>
            <input
              value={form.heroTitleLine1}
              onChange={(e) => onChange({ heroTitleLine1: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="COPA DO MUNDO"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Título linha 2</label>
            <input
              value={form.heroTitleLine2}
              onChange={(e) => onChange({ heroTitleLine2: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="FIFA 2026"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Descrição do hero</label>
          <textarea
            value={form.heroDescription}
            onChange={(e) => onChange({ heroDescription: e.target.value })}
            rows={3}
            className="input-dark w-full resize-none px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white mb-1">Estatísticas</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "statTeams" as const, label: "Seleções" },
            { key: "statGames" as const, label: "Jogos" },
            { key: "statHostCountries" as const, label: "Países sede" },
            { key: "statStadiums" as const, label: "Estádios" },
          ].map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">{field.label}</label>
              <input
                type="number"
                value={form[field.key]}
                onChange={(e) => onChange({ [field.key]: e.target.value })}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Países sede (texto)</label>
            <input
              value={form.hostCountries}
              onChange={(e) => onChange({ hostCountries: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="EUA, Canadá e México"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Título da secção</label>
            <input
              value={form.sectionTitle}
              onChange={(e) => onChange({ sectionTitle: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="Copa do Mundo FIFA 2026"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white mb-1">Banner CTA</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Título</label>
            <input
              value={form.ctaTitle}
              onChange={(e) => onChange({ ctaTitle: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Texto do botão</label>
            <input
              value={form.ctaButtonText}
              onChange={(e) => onChange({ ctaButtonText: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Descrição do CTA</label>
          <textarea
            value={form.ctaDescription}
            onChange={(e) => onChange({ ctaDescription: e.target.value })}
            rows={2}
            className="input-dark w-full resize-none px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {showStandings ? (
        <div>
          <h3 className="text-sm font-bold text-white mb-1">
            {format === "league" ? "Classificação (JSON)" : "Grupos (JSON)"}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            {format === "league"
              ? 'Array com um objeto: [{"group":"Geral","teams":[{"id":"1","name":"Arsenal","code":"ARS","group":"Geral","played":0,"wins":0,"draws":0,"losses":0,"gf":0,"ga":0,"points":0}]}]'
              : 'Array de objetos {"{ group: \'A\', teams: [...] }"}. Usado no separador Grupos da página pública.'}
          </p>
          <textarea
            value={form.groupsJson}
            onChange={(e) => onChange({ groupsJson: e.target.value })}
            rows={10}
            className="input-dark w-full resize-y px-3 py-2.5 text-sm font-mono"
            placeholder={
              format === "league"
                ? '[{"group":"Geral","teams":[{"id":"1","name":"Arsenal","code":"ARS","group":"Geral","played":0,"wins":0,"draws":0,"losses":0,"gf":0,"ga":0,"points":0}]}]'
                : '[{"group":"A","teams":[{"id":"1","name":"Brasil","code":"BRA","flag":"🇧🇷","group":"A","played":0,"wins":0,"draws":0,"losses":0,"gf":0,"ga":0,"points":0}]}]'
            }
          />
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-400">
            Competições em formato eliminatória não usam tabela de classificação. Configure os jogos na secção &quot;Gerir Jogos&quot;.
          </p>
        </div>
      )}
    </div>
  );
}

export type { CompetitionPageForm };
