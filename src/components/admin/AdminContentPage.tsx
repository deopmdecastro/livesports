import type { ElementType } from "react";

export interface AdminMetric {
  label: string;
  value: string;
  helper: string;
  tone?: "red" | "green" | "blue" | "yellow";
}

export interface AdminRow {
  title: string;
  subtitle: string;
  status: string;
  meta: string;
}

interface AdminContentPageProps {
  title: string;
  description: string;
  icon: ElementType;
  primaryAction?: string;
  onPrimaryAction?: () => void;
  metrics: AdminMetric[];
  rows: AdminRow[];
}

const toneClasses: Record<NonNullable<AdminMetric["tone"]>, string> = {
  red: "bg-[#E50914]/10 text-[#E50914]",
  green: "bg-emerald-500/10 text-emerald-400",
  blue: "bg-sky-500/10 text-sky-400",
  yellow: "bg-amber-500/10 text-amber-400",
};

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (["ativo", "online", "resolvido", "publicado", "aprovado"].includes(normalized)) {
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  }
  if (["pendente", "rascunho", "em analise", "em análise", "aberto"].includes(normalized)) {
    return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  }
  if (["pausado", "arquivado", "bloqueado"].includes(normalized)) {
    return "bg-gray-500/15 text-gray-300 border-white/10";
  }
  return "bg-red-500/15 text-red-400 border-red-500/20";
}

export default function AdminContentPage({
  title,
  description,
  icon: Icon,
  primaryAction,
  onPrimaryAction,
  metrics,
  rows,
}: AdminContentPageProps) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121218]">
        <div className="border-b border-white/10 bg-gradient-to-r from-[#211112] via-[#15151c] to-[#111827] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E50914]/10 text-[#E50914] ring-1 ring-[#E50914]/20">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">{title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-400">{description}</p>
              </div>
            </div>
            {primaryAction ? (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#E50914] px-4 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition-colors hover:bg-[#B00000]"
              >
                {primaryAction}
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-white/10 bg-black/25 p-4 transition-colors hover:border-white/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-xl font-black text-white">{metric.value}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">{metric.helper}</p>
                  </div>
                  {metric.tone ? (
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${toneClasses[metric.tone]}`}
                    >
                      KPI
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {rows.length > 0 ? (
            rows.map((row) => (
              <div
                key={`${row.title}-${row.meta}`}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{row.title}</p>
                  <p className="mt-0.5 truncate text-sm text-gray-500">{row.subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(
                      row.status
                    )}`}
                  >
                    {row.status}
                  </span>
                  <span className="text-xs text-gray-500">{row.meta}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-12 text-center text-sm text-gray-500">
              Nenhum registo para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
