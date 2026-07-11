"use client";

import { useEffect, useState } from "react";
import { BarChart3, DollarSign, Edit2, Eye, ImageIcon, MonitorPlay, Pause, Play, Plus, Search, Trash2, TrendingUp, Upload, Video, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatNumber } from "@/utils";
import type { Ad, AdPosition, AdStatus } from "@/types";
import toast from "react-hot-toast";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS, type ImageSizeHint } from "@/lib/image-upload-hints";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { apiRequest } from "@/lib/api";

const positionLabels: Record<string, string> = {
  header: "Imagem · topo global",
  sidebar: "Imagem · sidebar direita",
  in_content: "Imagem · meio do conteudo",
  footer: "Imagem · rodape global",
  popup: "Imagem · popup/flutuante",
  live_preroll: "Live · antes de reproduzir",
  player: "Player / intervalo legado",
};

const positionOptions = Object.entries(positionLabels).map(([value, label]) => ({ value, label }));

const imagePositions: AdPosition[] = ["header", "sidebar", "in_content", "footer", "popup"];

const placementFilters = [
  { value: "all", label: "Todos", helper: "Todas as campanhas e formatos", icon: BarChart3 },
  { value: "image", label: "Ads em imagem", helper: "Topo, meio, sidebar, popup e rodape", icon: ImageIcon },
  { value: "live_preroll", label: "Live antes de reproduzir", helper: "Imagem/video exibido antes do player", icon: MonitorPlay },
  { value: "player", label: "Player / intervalo", helper: "Posicao antiga para mid-roll ou fallback", icon: Video },
];

const positionDetails: Record<string, { title: string; description: string }> = {
  header: {
    title: "Topo global",
    description: "Banner horizontal exibido abaixo da navbar, como no placeholder superior das paginas publicas.",
  },
  in_content: {
    title: "Meio do conteudo",
    description: "Banner horizontal usado nas secoes principais da home e competicoes.",
  },
  sidebar: {
    title: "Sidebar direita",
    description: "Imagem em box lateral, ideal para campanhas quadradas ou 4:3.",
  },
  footer: {
    title: "Rodape global",
    description: "Banner horizontal exibido no final das paginas publicas.",
  },
  popup: {
    title: "Popup/flutuante",
    description: "Criativo flutuante que aparece sobre a experiencia publica.",
  },
  live_preroll: {
    title: "Live antes de reproduzir",
    description: "Criativo separado para aparecer antes da transmissao liberar o player da live.",
  },
  player: {
    title: "Player / intervalo legado",
    description: "Mantido para compatibilidade com ads antigos e intervalos dentro do player.",
  },
};

const imageFieldConfig: Record<string, { aspectClassName: string; sizeHint: ImageSizeHint }> = {
  header: { aspectClassName: "aspect-[12/1]", sizeHint: IMAGE_SIZE_PRESETS.adBanner },
  in_content: { aspectClassName: "aspect-[12/1]", sizeHint: IMAGE_SIZE_PRESETS.adBanner },
  footer: { aspectClassName: "aspect-[12/1]", sizeHint: IMAGE_SIZE_PRESETS.adBanner },
  sidebar: {
    aspectClassName: "aspect-[4/3]",
    sizeHint: {
      width: 640,
      height: 480,
      formats: ["JPG", "PNG", "WebP", "GIF"],
      ratio: "4:3",
      maxSizeKB: 180,
      notes: "Imagem para box lateral.",
    },
  },
  popup: {
    aspectClassName: "aspect-[4/3]",
    sizeHint: {
      width: 600,
      height: 450,
      formats: ["JPG", "PNG", "WebP", "GIF"],
      ratio: "4:3",
      maxSizeKB: 180,
      notes: "Criativo compacto para popup.",
    },
  },
  live_preroll: {
    aspectClassName: "aspect-video",
    sizeHint: {
      width: 1280,
      height: 720,
      formats: ["JPG", "PNG", "WebP", "GIF"],
      ratio: "16:9",
      maxSizeKB: 300,
      notes: "Imagem exibida antes da live com area segura no centro.",
    },
  },
  player: {
    aspectClassName: "aspect-video",
    sizeHint: IMAGE_SIZE_PRESETS.liveThumbnail,
  },
};

const formatOptions = [
  { value: "banner", label: "Banner" },
  { value: "video", label: "Video" },
  { value: "html", label: "HTML" },
  { value: "script", label: "Script" },
];

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "paused", label: "Pausados" },
  { value: "expired", label: "Expirados" },
];

const revenueData = [
  { month: "Jan", revenue: 3200 },
  { month: "Fev", revenue: 4100 },
  { month: "Mar", revenue: 3800 },
  { month: "Abr", revenue: 5200 },
  { month: "Mai", revenue: 6800 },
  { month: "Jun", revenue: 7200 },
];

const emptyForm = {
  title: "",
  campaign: "",
  position: "in_content",
  format: "banner",
  content: "",
  imageUrl: "",
  videoUrl: "",
  clickUrl: "",
  startDate: "",
  endDate: "",
};

function MediaPreview({ ad }: { ad: Ad }) {
  if (ad.format === "video" && ad.videoUrl) {
    return (
      <div className="relative h-9 w-14 overflow-hidden rounded bg-[#111]">
        <video src={ad.videoUrl} className="h-full w-full object-cover" muted playsInline />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Play className="h-3.5 w-3.5 fill-white text-white" />
        </div>
      </div>
    );
  }

  if (ad.imageUrl) {
    return <img src={ad.imageUrl} alt="" className="h-9 w-14 rounded object-cover" />;
  }

  return (
    <div className="flex h-9 w-14 items-center justify-center rounded bg-[#222] text-gray-500">
      <Video className="h-4 w-4" />
    </div>
  );
}

function VideoField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-gray-300">Video do anuncio</label>
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Apagar
          </button>
        )}
      </div>

      <div className="rounded-lg border border-[#2A2A2A] bg-[#111] p-3">
        <div className="flex h-40 items-center justify-center overflow-hidden rounded-md bg-black/30">
          {value ? (
            <video src={value} className="h-full w-full object-contain" controls muted playsInline />
          ) : (
            <div className="text-center text-gray-500">
              <Video className="mx-auto mb-2 h-8 w-8" />
              <p className="text-xs font-medium">Sem video selecionado</p>
            </div>
          )}
        </div>
      </div>

      {!disabled && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={value.startsWith("data:") ? "" : value}
            onChange={(event) => onChange(event.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
            placeholder="https://.../video.mp4 ou .webm"
          />
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#202020] px-3 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-[#2A2A2A]">
            <Upload className="h-4 w-4" />
            Carregar
            <input type="file" accept="video/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        </div>
      )}
    </div>
  );
}

function statusClass(status: AdStatus) {
  if (status === "active") return "bg-green-500/20 text-green-400";
  if (status === "paused") return "bg-yellow-500/20 text-yellow-400";
  return "bg-gray-500/20 text-gray-400";
}

function statusLabel(status: AdStatus) {
  if (status === "active") return "Ativo";
  if (status === "paused") return "Pausado";
  if (status === "draft") return "Rascunho";
  return "Expirado";
}

function isImagePosition(position: string) {
  return imagePositions.includes(position as AdPosition);
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = ads.filter((ad) => {
    const matchSearch = ad.title.toLowerCase().includes(search.toLowerCase()) || ad.campaign?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || ad.status === statusFilter;
    const matchPlacement =
      placementFilter === "all" ||
      (placementFilter === "image" ? isImagePosition(ad.position) : ad.position === placementFilter);
    return matchSearch && matchStatus && matchPlacement;
  });

  useEffect(() => {
    apiRequest<Ad[]>("/ads")
      .then(setAds)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar anuncios."))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    const defaultPosition =
      placementFilter === "live_preroll" || placementFilter === "player"
        ? placementFilter
        : "in_content";
    setEditingAd(null);
    setForm({ ...emptyForm, position: defaultPosition, format: "banner" });
    setModalMode("create");
  };

  const openModal = (mode: "edit" | "view", ad: Ad) => {
    setEditingAd(ad);
    setForm({
      title: ad.title,
      campaign: ad.campaign || "",
      position: ad.position,
      format: ad.format,
      content: ad.content,
      imageUrl: ad.imageUrl || "",
      videoUrl: ad.videoUrl || "",
      clickUrl: ad.clickUrl || "",
      startDate: ad.startDate || "",
      endDate: ad.endDate || "",
    });
    setModalMode(mode);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o nome do anuncio.");
      return;
    }

    if (form.format === "video" && !form.videoUrl.trim()) {
      toast.error("Informe ou carregue o video do anuncio.");
      return;
    }

    if (form.format === "banner" && !form.imageUrl.trim()) {
      toast.error("Carregue a imagem do anuncio.");
      return;
    }

    if (form.position === "live_preroll" && !form.imageUrl.trim() && !form.videoUrl.trim()) {
      toast.error("Configure a imagem do pre-roll da live antes de guardar.");
      return;
    }

    const payload = {
      ...form,
      position: form.position as Ad["position"],
      format: form.format as Ad["format"],
      imageUrl: form.format === "video" ? form.imageUrl : form.imageUrl,
      videoUrl: form.format === "video" ? form.videoUrl : "",
      updatedAt: new Date().toISOString(),
    };

    try {
      if (modalMode === "edit" && editingAd) {
        const updated = await apiRequest<Ad>(`/ads/${editingAd.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...payload, status: editingAd.status }),
        });
        setAds((current) => current.map((ad) => ad.id === editingAd.id ? updated : ad));
        toast.success("Anuncio atualizado!");
      } else {
        const created = await apiRequest<Ad>("/ads", {
          method: "POST",
          body: JSON.stringify({ ...payload, status: "active" }),
        });
        setAds((current) => [created, ...current]);
        toast.success("Anuncio criado!");
      }
      setModalMode(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel guardar o anuncio.");
    }
  };

  const toggleStatus = async (ad: Ad) => {
    const nextStatus = ad.status === "active" ? "paused" : "active";
    try {
      const updated = await apiRequest<Ad>(`/ads/${ad.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...ad, status: nextStatus }),
      });
      setAds((current) => current.map((item) => item.id === ad.id ? updated : item));
      toast.success("Status atualizado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o status.");
    }
  };

  const totalRevenue = ads.reduce((sum, ad) => sum + ad.revenue, 0);
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const avgCtr = ads.length > 0 ? (ads.reduce((sum, ad) => sum + ad.ctr, 0) / ads.length).toFixed(2) : "0";
  const readOnly = modalMode === "view";
  const placementCounts = {
    all: ads.length,
    image: ads.filter((ad) => isImagePosition(ad.position)).length,
    live_preroll: ads.filter((ad) => ad.position === "live_preroll").length,
    player: ads.filter((ad) => ad.position === "player").length,
  };
  const selectedPosition = positionDetails[form.position] || positionDetails.in_content;
  const selectedImageConfig = imageFieldConfig[form.position] || imageFieldConfig.in_content;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Ads Manager</h2>
          <p className="text-xs text-gray-400">{loading ? "A carregar anuncios reais..." : `${ads.length} anuncios cadastrados · imagem e live separados`}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
          <Plus className="h-4 w-4" />
          Novo Anuncio
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Receita Total", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-green-400" },
          { label: "Impressoes", value: formatNumber(totalImpressions), icon: Eye, color: "text-red-400" },
          { label: "Cliques", value: formatNumber(totalClicks), icon: BarChart3, color: "text-purple-400" },
          { label: "CTR Medio", value: `${avgCtr}%`, icon: TrendingUp, color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {placementFilters.map(({ value, label, helper, icon: Icon }) => {
          const active = placementFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPlacementFilter(value)}
              className={`rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-[#E50914]/60 bg-[#E50914]/10 shadow-lg shadow-[#E50914]/10"
                  : "border-[#2A2A2A] bg-[#1A1A1A] hover:border-white/15 hover:bg-[#202020]"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className={`rounded-lg p-2 ${active ? "bg-[#E50914] text-white" : "bg-white/5 text-gray-300"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold text-gray-300">
                  {placementCounts[value as keyof typeof placementCounts] || 0}
                </span>
              </div>
              <p className="text-sm font-bold text-white">{label}</p>
              <p className="mt-1 text-xs text-gray-500">{helper}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Receita por mes</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
            <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "8px" }} formatter={(value: number) => [formatCurrency(value), "Receita"]} />
            <Bar dataKey="revenue" fill="#E50914" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar anuncios..." className="input-dark w-full py-2.5 pl-9 pr-4 text-sm" />
        </div>
        <AdminSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="sm:w-44" />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["ID", "Titulo", "Campanha", "Posicao", "Impressoes", "Cliques", "CTR", "Receita", "Status", "Acoes"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad) => (
                <tr key={ad.id} className="table-row-hover border-b border-[#2A2A2A] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{ad.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MediaPreview ad={ad} />
                      <span className="text-sm font-medium text-white">{ad.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">{ad.campaign || "-"}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{positionLabels[ad.position] || ad.position}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{ad.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{ad.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{ad.ctr}%</td>
                  <td className="px-4 py-3 text-xs font-semibold text-green-400">{formatCurrency(ad.revenue)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass(ad.status)}`}>{statusLabel(ad.status)}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <AdminActionButton title="Visualizar" onClick={() => openModal("view", ad)} tone="view"><Eye className="h-3.5 w-3.5" /></AdminActionButton>
                      <AdminActionButton title={ad.status === "active" ? "Pausar" : "Ativar"} onClick={() => toggleStatus(ad)} tone="warning">
                        {ad.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </AdminActionButton>
                      <AdminActionButton title="Editar" onClick={() => openModal("edit", ad)} tone="edit"><Edit2 className="h-3.5 w-3.5" /></AdminActionButton>
                      <AdminActionButton title="Remover" onClick={async () => { try { await apiRequest(`/ads/${ad.id}`, { method: "DELETE" }); setAds((current) => current.filter((item) => item.id !== ad.id)); toast.success("Anuncio removido!"); } catch (error) { toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o anuncio."); } }} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] p-5">
              <h3 className="font-bold text-white">{modalMode === "create" ? "Novo Anuncio" : modalMode === "edit" ? "Editar Anuncio" : "Visualizar Anuncio"}</h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Titulo *</label>
                <input disabled={readOnly} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Nome do anuncio" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Campanha</label>
                <input disabled={readOnly} value={form.campaign} onChange={(event) => setForm({ ...form, campaign: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Nome da campanha" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Posicao</label><AdminSelect disabled={readOnly} value={form.position} onChange={(value) => setForm({ ...form, position: value })} options={positionOptions} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Formato</label><AdminSelect disabled={readOnly} value={form.format} onChange={(value) => setForm({ ...form, format: value })} options={formatOptions} /></div>
              </div>
              <div className="rounded-lg border border-[#2A2A2A] bg-[#111] p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E50914]">{selectedPosition.title}</p>
                <p className="mt-1 text-xs text-gray-400">{selectedPosition.description}</p>
              </div>
              <AdminImageField
                label={form.position === "live_preroll" ? "Imagem do pre-roll antes da live" : form.format === "video" ? "Poster / imagem de fallback" : "Imagem do anuncio"}
                value={form.imageUrl}
                onChange={(value) => setForm({ ...form, imageUrl: value })}
                disabled={readOnly}
                aspectClassName={selectedImageConfig.aspectClassName}
                sizeHint={selectedImageConfig.sizeHint}
              />
              {form.format === "video" && (
                <VideoField
                  value={form.videoUrl}
                  onChange={(value) => setForm({ ...form, videoUrl: value })}
                  disabled={readOnly}
                />
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">URL de destino</label>
                <input disabled={readOnly} value={form.clickUrl} onChange={(event) => setForm({ ...form, clickUrl: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="https://..." />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Data inicio</label><input disabled={readOnly} type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Data fim</label><input disabled={readOnly} type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Conteudo HTML/Script</label>
                <textarea disabled={readOnly} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={4} className="input-dark w-full resize-none px-3 py-2.5 font-mono text-xs" placeholder="<img src='...' />" />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#2A2A2A] p-5">
              <button onClick={() => setModalMode(null)} className="rounded-lg bg-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-[#3A3A3A]">Fechar</button>
              {!readOnly && <button onClick={handleSave} className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">{modalMode === "edit" ? "Salvar" : "Criar Anuncio"}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
