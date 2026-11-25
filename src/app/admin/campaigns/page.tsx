"use client";

import { useEffect, useState } from "react";
import { Megaphone, Edit2, Trash2, RefreshCw, Plus, X } from "lucide-react";
import AdminFormWizard from "@/components/admin/AdminFormWizard";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface Campaign {
  id: string;
  name: string;
  advertiser: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  status: string;
  startDate: string;
  endDate: string;
  positions: string[];
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  paused: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  completed: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  draft: "bg-red-500/15 text-red-400 border-red-500/20",
};

function formatCurrency(v: number) { return v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).replace(/\s/g, ' '); }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ name: "", advertiser: "", budget: 0, status: "active", startDate: "", endDate: "", positions: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Campaign[]>("/campaigns");
      setCampaigns(data || []);
    } catch (err) {
      toast.error("Erro ao carregar campanhas");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({ name: c.name, advertiser: c.advertiser, budget: c.budget, status: c.status, startDate: c.startDate?.slice(0, 10) || "", endDate: c.endDate?.slice(0, 10) || "", positions: (c.positions || []).join(", ") });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome obrigatorio"); return; }
    setSaving(true);
    try {
      const payload = { ...form, budget: Number(form.budget), positions: form.positions ? String(form.positions).split(",").map((s: string) => s.trim()).filter(Boolean) : [] };
      if (editing) {
        await apiRequest(`/campaigns/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Campanha atualizada!");
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminar "${name}"?`)) return;
    try {
      await apiRequest(`/campaigns/${id}`, { method: "DELETE" });
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success("Campanha eliminada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar");
    }
  };

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === "active").length,
    totalBudget: campaigns.reduce((s, c) => s + (c.budget || 0), 0),
    totalSpent: campaigns.reduce((s, c) => s + (c.spent || 0), 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Megaphone className="h-5 w-5 text-[#E50914]" /> Campanhas</h1>
          <p className="text-xs text-gray-500 mt-0.5">{stats.total} campanhas · {stats.active} ativas</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Campanhas", value: stats.total, color: "text-white" },
          { label: "Ativas", value: stats.active, color: "text-emerald-400" },
          { label: "Orcamento", value: formatCurrency(stats.totalBudget), color: "text-amber-400" },
          { label: "Gasto", value: formatCurrency(stats.totalSpent), color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <p className={`text-lg font-black ${color}`}>{value}</p>
            <p className="text-[10px] uppercase text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E50914]" /></div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600"><Megaphone className="h-12 w-12 opacity-20 mb-4" /><p>Nenhuma campanha encontrada</p></div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4 hover:border-[#E50914]/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{c.name}</h3>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[c.status] || STATUS_COLORS.active}`}>{c.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{c.advertiser}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Orcamento", val: formatCurrency(c.budget) },
                      { label: "Gasto", val: formatCurrency(c.spent) },
                      { label: "CTR", val: `${c.ctr || 0}%` },
                    ].map(({ label, val }) => (
                      <div key={label}><p className="text-[10px] text-gray-500">{label}</p><p className="text-sm font-bold text-white">{val}</p></div>
                    ))}
                  </div>
                  {(c.positions || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.positions.map((p: string) => (
                        <span key={p} className="text-[9px] bg-[#E50914]/10 text-[#E50914] px-2 py-0.5 rounded-full font-bold">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminFormWizard
        open={showModal}
        title={editing ? `Editar: ${editing.name}` : "Nova Campanha"}
        subtitle="Defina orçamento, anunciante e estado"
        icon={editing ? Edit2 : Plus}
        tone={editing ? "edit" : "create"}
        onClose={() => setShowModal(false)}
        primaryLabel="Guardar"
        onPrimary={() => void handleSave()}
        primaryLoading={saving}
        maxWidthClass="max-w-md"
        showStepNav={false}
      >
        <div className="space-y-3">
          {[
            { label: "Nome *", key: "name", type: "text" as const },
            { label: "Anunciante", key: "advertiser", type: "text" as const },
            { label: "Orçamento (EUR)", key: "budget", type: "number" as const },
            { label: "Status", key: "status", type: "select" as const },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold text-gray-400">{label}</label>
              {type === "select" ? (
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm">
                  {["active", "paused", "completed", "draft"].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" />
              )}
            </div>
          ))}
        </div>
      </AdminFormWizard>
    </div>
  );
}
