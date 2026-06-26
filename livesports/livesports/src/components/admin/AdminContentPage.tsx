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
  metrics: AdminMetric[];
  rows: AdminRow[];
}

const toneClasses: Record<NonNullable<AdminMetric["tone"]>, string> = {
  red: "bg-[#E50914]/10 text-[#E50914]",
  green: "bg-green-500/10 text-green-400",
  blue: "bg-blue-500/10 text-blue-400",
  yellow: "bg-yellow-500/10 text-yellow-400",
};

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (["ativo", "online", "resolvido", "publicado", "aprovado"].includes(normalized)) {
    return "bg-green-500/15 text-green-400";
  }
  if (["pendente", "rascunho", "em analise", "aberto"].includes(normalized)) {
    return "bg-yellow-500/15 text-yellow-400";
  }
  if (["pausado", "arquivado", "bloqueado"].includes(normalized)) {
    return "bg-gray-500/15 text-gray-300";
  }
  return "bg-blue-500/15 text-blue-400";
}

export default function AdminContentPage({
  title,
  description,
  icon: Icon,
  primaryAction,
  metrics,
  rows,
}: AdminContentPageProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E50914]/10 text-[#E50914]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-400">{description}</p>
          </div>
        </div>
        {primaryAction && (
          <button className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B00000]">
            {primaryAction}
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{metric.label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${toneClasses[metric.tone || "red"]}`}>
                {metric.helper}
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="border-b border-[#2A2A2A] px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Itens recentes</h3>
        </div>
        <div className="divide-y divide-[#2A2A2A]">
          {rows.map((row) => (
            <div key={`${row.title}-${row.subtitle}`} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="text-sm font-semibold text-white">{row.title}</p>
                <p className="mt-1 text-xs text-gray-400">{row.subtitle}</p>
              </div>
              <span className={`w-fit rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusClass(row.status)}`}>
                {row.status}
              </span>
              <p className="text-xs text-gray-500 md:text-right">{row.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
