"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber } from "@/utils";

interface StatCard {
  title: string;
  value: string | number;
  growth?: number;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
}

interface AdminStatsCardsProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4;
}

export default function AdminStatsCards({ stats, columns = 4 }: AdminStatsCardsProps) {
  const gridCols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 xl:grid-cols-4" };

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridCols[columns]}`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        const color = stat.color || "#E50914";
        const hasGrowth = typeof stat.growth === "number";
        const isPositive = hasGrowth && stat.growth! >= 0;

        return (
          <div key={stat.title} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5 hover:border-[#E50914]/20 transition-all group">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{stat.title}</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
                </p>
                {stat.subtitle && <p className="mt-0.5 text-[10px] text-gray-600">{stat.subtitle}</p>}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            </div>
            {hasGrowth && (
              <div className="flex items-center gap-1.5">
                {isPositive ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                <span className={`text-xs font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {isPositive ? "+" : ""}{stat.growth}%
                </span>
                <span className="text-xs text-gray-600">vs mês anterior</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
