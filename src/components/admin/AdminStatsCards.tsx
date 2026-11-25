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
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${gridCols[columns]}`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        const color = stat.color || "#E50914";
        const hasGrowth = typeof stat.growth === "number";
        const isPositive = hasGrowth && stat.growth! >= 0;

        return (
          <div
            key={stat.title}
            className="group rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-4 transition-all hover:border-[#E50914]/25 hover:shadow-[0_0_24px_rgba(229,9,20,0.06)] sm:p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {stat.title}
                </p>
                <p className="mt-1 truncate text-2xl font-black text-white">
                  {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
                </p>
                {stat.subtitle ? (
                  <p className="mt-0.5 text-[10px] text-gray-600">{stat.subtitle}</p>
                ) : null}
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            </div>
            {hasGrowth ? (
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                )}
                <span
                  className={`text-xs font-bold ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {stat.growth}%
                </span>
                <span className="text-xs text-gray-600">vs mês anterior</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
