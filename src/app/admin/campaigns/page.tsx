"use client";

import { useState } from "react";
import { Megaphone, Plus, Edit2, Trash2, TrendingUp, Eye, DollarSign, Calendar, RefreshCw, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

interface Campaign {
  id: string;
  name: string;
  advertiser: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  status: "active" | "paused" | "completed" | "draft";
  startDate: string;
  endDate: string;
  positions: string[];
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  paused: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  completed: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  draft: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const POSITION_LABELS: Record<string, string> = {
  header: "Topo", sidebar: "Sidebar", footer: "Rodapé",
  "in-content": "Conteúdo", player: "Player", popup: "Popup",
  "in_content": "Conteúdo", live_preroll: "Pré-roll Live",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: "1", name: "Nike Summer 2026", advertiser: "Nike", budget: 45000, spent: 32000, impressions: 845000, clicks: 12675, ctr: 1.5, status: "active", startDate: "2026-06-01", endDate: "2026-08-31", positions: ["header", "sidebar"] },
    { id: "2", name: "Adidas Pro Series", advertiser: "Adidas", budget: 28000, spent: 15000, impressions: 520000, clicks: 7800, ctr: 1.5, status: "active", startDate: "2026-06-15", endDate: "2026-09-15", positions: ["sidebar", "in_content"] },
    { id: "3", name: "ESPN Subscription Drive", advertiser: "ESPN", budget: 60000, spent: 60000, impressions: 1200000, clicks: 24000, ctr: 2.0, status: "completed", startDate: "2026-04-01", endDate: "2026-06-01", positions: ["header", "player", "popup"] },
    { id: "4", name: "Betano Launch", advertiser: "Betano", budget: 35000, spent: 5000, impressions: 85000, clicks: 2125, ctr: 2.5, status: "draft", startDate: "2026-07-15", endDate: "2026-12-15", positions: ["sidebar", "popup"] },
    { id: "5", name: "Coca-Cola World Cup Special", advertiser: "Coca-Cola", budget: 120000, spent: 78000, impressions: 2200000, clicks: 41800, ctr: 1.9, status: "active", startDate: "2026-06-05", endDate: "2026-07-20", positions: ["header", "sidebar", "live_preroll"] },
    { id: "6", name: "Samsung QLED Promo", advertiser: "Samsung", budget: 55000, spent: 55000, impressions: 980000, clicks: 14700, ctr: 1.5, status: "completed", startDate: "2026-05-01", endDate: "2026-06-15", positions: ["header", "player"] },
  ]);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    totalBudget: campaigns.reduce((s, c) => s + c.budget, 0),
    totalSpent: campaigns.reduce((s, c) => s + c.spent, 0),
    totalImpressions: campaigns.reduce((s, c) => s + c.impressions, 0),
    totalClicks: campaigns.reduce((s, c) => s + c.clicks, 0),
    avgCtr: campaigns.length > 0 ? (campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length).toFixed(1) : "0",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#E50914]" /> Campanhas
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{stats.active} ativas · {stats.total} total</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#1A1A1A]">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
            <Plus className="h-4 w-4" /> Nova Campanha
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Orçamento Total", value: `R$ ${(stats.totalBudget / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-yellow-400" },
          { label: "Gasto", value: `R$ ${(stats.totalSpent / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-[#E50914]" },
          { label: "Impressões", value: `${(stats.totalImpressions / 1000000).toFixed(1)}M`, icon: Eye, color: "text-blue-400" },
          { label: "CTR Médio", value: `${stats.avgCtr}%`, icon: BarChart3, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-[10px] text-gray-500 uppercase">{label}</span>
            </div>
            <p className="text-xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const progress = Math.round((campaign.spent / campaign.budget) * 100);
          return (
            <div key={campaign.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden hover:border-[#E50914]/20 transition-all">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-white">{campaign.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[campaign.status]}`}>
                        {campaign.status === "active" ? "Ativa" : campaign.status === "paused" ? "Pausada" : campaign.status === "completed" ? "Concluída" : "Rascunho"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{campaign.advertiser}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-400/10"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-gray-500">Orçamento: R$ {(campaign.budget / 1000).toFixed(0)}K</span>
                    <span className="text-gray-400">{progress}% utilizado</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1A1A2A] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#FF6B35] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Meta Cards */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: "Impressões", value: (campaign.impressions / 1000).toFixed(0) + "K" },
                    { label: "Cliques", value: (campaign.clicks / 1000).toFixed(1) + "K" },
                    { label: "CTR", value: campaign.ctr + "%" },
                    { label: "Gasto", value: "R$ " + (campaign.spent / 1000).toFixed(0) + "K" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-[#1A1A2A] p-2 text-center">
                      <p className="text-[9px] text-gray-500 uppercase">{label}</p>
                      <p className="text-xs font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Positions & Dates */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    {campaign.positions.map((pos) => (
                      <span key={pos} className="rounded-full bg-[#1A1A2A] border border-[#2A2A3A] px-2 py-0.5 text-[9px] text-gray-400">
                        {POSITION_LABELS[pos] || pos}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {new Date(campaign.startDate).toLocaleDateString("pt-PT")} – {new Date(campaign.endDate).toLocaleDateString("pt-PT")}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
