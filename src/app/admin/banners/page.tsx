"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Edit2, Eye, Image, Plus, Search, Trash2, X, Monitor,
  LayoutTemplate, ExternalLink, Calendar, ToggleLeft, ToggleRight,
  GripVertical, Info, Sparkles, Loader2,
} from "lucide-react";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import { apiRequest } from "@/lib/api";
import AdminActionButton from "@/components/admin/AdminActionButton";
import toast from "react-hot-toast";

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  linkUrl?: string;
  ctaText?: string;
  position: string;
  active: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const positionOptions = [
  { value: "hero", label: "Hero principal" },
  { value: "sidebar", label: "Sidebar" },
  { value: "in_content", label: "Entre conteudos" },
];

const activeOptions = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

const emptyHeroForm = {
  title: "",
  subtitle: "",
  badge: "",
  imageUrl: "",
  linkUrl: "",
  ctaText: "Assistir Agora",
  active: "true",
  sortOrder: 0,
  startDate: "",
  endDate: "",
};

const emptyBannerForm = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  position: "hero",
  active: "true",
  startDate: "",
  endDate: "",
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-gray-300">
      {children}
      {required && <span className="ml-1 text-[#E50914]">*</span>}
    </label>
  );
}

function Input({
  value, onChange, placeholder, disabled, type = "text",
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="input-dark w-full px-3 py-2.5 text-sm"
    />
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        active
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          : "bg-gray-500/15 text-gray-500 border border-gray-500/20"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-gray-500"}`} />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

const TABS = ["Hero / Carrossel", "Banners do Site"] as const;
type Tab = typeof TABS[number];

export default function BannersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Hero / Carrossel");
  const [loading, setLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState<BannerItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [heroSearch, setHeroSearch] = useState("");
  const [heroModal, setHeroModal] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedHero, setSelectedHero] = useState<BannerItem | null>(null);
  const [heroForm, setHeroForm] = useState(emptyHeroForm);
  const [saving, setSaving] = useState(false);
  const [bannerSearch, setBannerSearch] = useState("");
  const [bannerModal, setBannerModal] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const json = await apiRequest<{ items: BannerItem[] }>("/banners");
      const items = json.items || [];
      const heroItems = items.filter((b: BannerItem) => b.position === "hero");
      const otherItems = items.filter((b: BannerItem) => b.position !== "hero");
      setHeroSlides(heroItems.sort((a, b) => a.sortOrder - b.sortOrder));
      setBanners(otherItems);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreateHero = () => {
    setSelectedHero(null);
    setHeroForm({ ...emptyHeroForm, sortOrder: heroSlides.length });
    setHeroModal("create");
  };

  const openHeroModal = (mode: "edit" | "view", slide: BannerItem) => {
    setSelectedHero(slide);
    setHeroForm({
      title: slide.title,
      subtitle: slide.subtitle || "",
      badge: slide.badge || "",
      imageUrl: slide.imageUrl,
      linkUrl: slide.linkUrl || "",
      ctaText: slide.ctaText || "Assistir Agora",
      active: String(slide.active),
      sortOrder: slide.sortOrder,
      startDate: slide.startDate || "",
      endDate: slide.endDate || "",
    });
    setHeroModal(mode);
  };

  const saveHeroSlide = async () => {
    if (!heroForm.title.trim() || !heroForm.imageUrl.trim()) {
      toast.error("Informe titulo e imagem do slide.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: heroForm.title,
        subtitle: heroForm.subtitle || null,
        badge: heroForm.badge || null,
        imageUrl: heroForm.imageUrl,
        linkUrl: heroForm.linkUrl || null,
        ctaText: heroForm.ctaText || "Assistir Agora",
        position: "hero",
        active: heroForm.active === "true",
        sortOrder: heroForm.sortOrder,
        startDate: heroForm.startDate || null,
        endDate: heroForm.endDate || null,
      };

      if (heroModal === "edit" && selectedHero) {
        const res = await fetch(`/banners/${selectedHero.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Slide do Hero atualizado!");
          fetchBanners();
        } else {
          toast.error(json.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(`/banners`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Slide do Hero criado!");
          fetchBanners();
        } else {
          toast.error(json.error || "Erro ao criar");
        }
      }
      setHeroModal(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleHeroActive = async (id: string, currentActive: boolean) => {
    try {
      await apiRequest(`/banners/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        setHeroSlides((prev) => prev.map((s) => s.id === id ? { ...s, active: !currentActive } : s));
        toast.success(!currentActive ? "Slide ativado!" : "Slide desativado!");
      }
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  const deleteHeroSlide = async (id: string) => {
    if (!confirm("Remover este slide?")) return;
    try {
      const res = await fetch(`/banners/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setHeroSlides((prev) => prev.filter((s) => s.id !== id));
        toast.success("Slide removido!");
      }
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const openCreateBanner = () => {
    setSelectedBanner(null);
    setBannerForm(emptyBannerForm);
    setBannerModal("create");
  };

  const openBannerModal = (mode: "edit" | "view", banner: BannerItem) => {
    setSelectedBanner(banner);
    setBannerForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      position: banner.position,
      active: String(banner.active),
      startDate: banner.startDate || "",
      endDate: banner.endDate || "",
    });
    setBannerModal(mode);
  };

  const saveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.imageUrl.trim()) {
      toast.error("Informe titulo e imagem.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: bannerForm.title,
        imageUrl: bannerForm.imageUrl,
        linkUrl: bannerForm.linkUrl || null,
        position: bannerForm.position,
        active: bannerForm.active === "true",
        startDate: bannerForm.startDate || null,
        endDate: bannerForm.endDate || null,
      };

      if (bannerModal === "edit" && selectedBanner) {
        const res = await fetch(`/banners/${selectedBanner.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Banner atualizado!");
          fetchBanners();
        } else {
          toast.error(json.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(`/banners`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Banner criado!");
          fetchBanners();
        } else {
          toast.error(json.error || "Erro ao criar");
        }
      }
      setBannerModal(null);
    } catch (err) {
      toast.error("Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleBannerActive = async (id: string, currentActive: boolean) => {
    try {
      await apiRequest(`/banners/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        setBanners((prev) => prev.map((b) => b.id === id ? { ...b, active: !currentActive } : b));
        toast.success(!currentActive ? "Banner ativado!" : "Banner desativado!");
      }
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Remover este banner?")) return;
    try {
      const res = await fetch(`/banners/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        toast.success("Banner removido!");
      }
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const filteredHero = heroSlides.filter((s) => s.title.toLowerCase().includes(heroSearch.toLowerCase()));
  const filteredBanners = banners.filter((b) => b.title.toLowerCase().includes(bannerSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#E50914]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Gestao Visual
            </div>
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Banners & Hero
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Gere os slides do Hero (carrossel da pagina inicial) e banners publicitarios do site.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#1E1E2A] bg-[#111118] p-3 text-center">
              <p className="text-xl font-black text-white">{heroSlides.filter((s) => s.active).length}</p>
              <p className="text-[10px] text-gray-500">Slides ativos</p>
            </div>
            <div className="rounded-xl border border-[#1E1E2A] bg-[#111118] p-3 text-center">
              <p className="text-xl font-black text-white">{banners.filter((b) => b.active).length}</p>
              <p className="text-[10px] text-gray-500">Banners ativos</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-1 rounded-xl border border-[#1E1E2A] bg-[#0A0A0F] p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-[#E50914] text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "Hero / Carrossel" ? <Monitor className="h-4 w-4" /> : <Image className="h-4 w-4" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Hero / Carrossel" && (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <Info className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-300 leading-relaxed">
              <strong className="text-red-200">Como funciona:</strong> Estes slides aparecem no carrossel principal da landing page
              <strong className="text-white"> quando nao ha lives ao vivo ou em destaque</strong>.
              Ordene-os por prioridade - o slide com menor numero de ordem aparece primeiro.
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Pesquisar slides..."
                className="input-dark w-full py-2.5 pl-9 pr-4 text-sm"
              />
            </div>
            <button
              onClick={openCreateHero}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-sm font-bold text-white hover:from-[#FF1A24] hover:to-[#E50914] transition-all shadow-[0_4px_20px_rgba(229,9,20,0.3)]"
            >
              <Plus className="h-4 w-4" />
              Novo Slide
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredHero.map((slide) => (
              <div
                key={slide.id}
                className={`group overflow-hidden rounded-2xl border transition-all ${
                  slide.active
                    ? "border-[#E50914]/25 bg-[#0E0E16] hover:border-[#E50914]/50"
                    : "border-[#1E1E2A] bg-[#0A0A0F] opacity-60 hover:opacity-80"
                }`}
              >
                <div className="relative aspect-[16/7] overflow-hidden bg-[#111118]">
                  <img src={slide.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {slide.badge && (
                      <span className="mb-1 inline-block rounded-full bg-[#E50914]/90 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-widest">
                        {slide.badge}
                      </span>
                    )}
                    <p className="text-sm font-black text-white leading-tight line-clamp-1">{slide.title}</p>
                    {slide.subtitle && <p className="mt-0.5 text-[10px] text-white/60 line-clamp-1">{slide.subtitle}</p>}
                  </div>
                  <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[10px] font-black text-white border border-white/10">
                    {slide.sortOrder}
                  </div>
                  <button onClick={() => toggleHeroActive(slide.id, slide.active)} className="absolute top-2 right-2" title={slide.active ? "Desativar" : "Ativar"}>
                    {slide.active ? <ToggleRight className="h-6 w-6 text-emerald-400 drop-shadow-md" /> : <ToggleLeft className="h-6 w-6 text-gray-500" />}
                  </button>
                </div>

                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <StatusBadge active={slide.active} />
                    {slide.linkUrl && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                        <ExternalLink className="h-2.5 w-2.5" />
                        {slide.ctaText}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white truncate">{slide.title}</p>
                  {slide.subtitle && <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">{slide.subtitle}</p>}
                  {(slide.startDate || slide.endDate) && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {slide.startDate && <span>De {slide.startDate}</span>}
                      {slide.endDate && <span>ate {slide.endDate}</span>}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <GripVertical className="h-3.5 w-3.5" />
                      <span>Ordem #{slide.sortOrder}</span>
                    </div>
                    <div className="flex gap-1">
                      <AdminActionButton title="Visualizar" onClick={() => openHeroModal("view", slide)} tone="view">
                        <Eye className="h-3.5 w-3.5" />
                      </AdminActionButton>
                      <AdminActionButton title="Editar" onClick={() => openHeroModal("edit", slide)} tone="edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </AdminActionButton>
                      <AdminActionButton title="Remover" onClick={() => deleteHeroSlide(slide.id)} tone="danger">
                        <Trash2 className="h-3.5 w-3.5" />
                      </AdminActionButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredHero.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                <Monitor className="h-10 w-10 text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium">Nenhum slide encontrado</p>
                <button onClick={openCreateHero} className="mt-4 text-sm text-[#E50914] hover:underline">
                  + Criar primeiro slide
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Banners do Site" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total", value: banners.length, color: "text-white" },
              { label: "Ativos", value: banners.filter((b) => b.active).length, color: "text-emerald-400" },
              { label: "Sidebar", value: banners.filter((b) => b.position === "sidebar").length, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input value={bannerSearch} onChange={(e) => setBannerSearch(e.target.value)} placeholder="Pesquisar banners..." className="input-dark w-full py-2.5 pl-9 pr-4 text-sm" />
            </div>
            <button onClick={openCreateBanner} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-sm font-bold text-white hover:from-[#FF1A24] hover:to-[#E50914] transition-all shadow-[0_4px_20px_rgba(229,9,20,0.3)]">
              <Plus className="h-4 w-4" />
              Novo Banner
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBanners.map((banner) => (
              <div key={banner.id} className="group overflow-hidden rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] hover:border-[#E50914]/25 transition-all">
                <div className="aspect-[16/7] bg-[#111118] overflow-hidden">
                  <img src={banner.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <StatusBadge active={banner.active} />
                    <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
                      {positionOptions.find((o) => o.value === banner.position)?.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{banner.title}</h3>
                  <p className="mt-1 truncate text-xs text-gray-500">{banner.linkUrl || "Sem link"}</p>
                  <div className="mt-4 flex justify-end gap-1">
                    <AdminActionButton title="Visualizar" onClick={() => openBannerModal("view", banner)} tone="view">
                      <Eye className="h-3.5 w-3.5" />
                    </AdminActionButton>
                    <AdminActionButton title="Editar" onClick={() => openBannerModal("edit", banner)} tone="edit">
                      <Edit2 className="h-3.5 w-3.5" />
                    </AdminActionButton>
                    <AdminActionButton title="Remover" onClick={() => deleteBanner(banner.id)} tone="danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </AdminActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {heroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E50914]/15 border border-[#E50914]/20">
                  <Sparkles className="h-4 w-4 text-[#E50914]" />
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    {heroModal === "create" ? "Novo Slide do Hero" : heroModal === "edit" ? "Editar Slide" : "Visualizar Slide"}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {heroModal === "view" ? "Detalhes do slide" : "Preencha os dados do slide do carrossel"}
                  </p>
                </div>
              </div>
              <button onClick={() => setHeroModal(null)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {heroForm.imageUrl && (
              <div className="relative h-32 overflow-hidden border-b border-[#1E1E2A]">
                <img src={heroForm.imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  {heroForm.badge && (
                    <span className="mb-1 inline-block rounded-full bg-[#E50914] px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-widest">
                      {heroForm.badge}
                    </span>
                  )}
                  <p className="text-sm font-black text-white leading-tight line-clamp-1">{heroForm.title || "Titulo do slide..."}</p>
                  <p className="text-[10px] text-white/60 mt-0.5 line-clamp-1">{heroForm.subtitle || "Subtitulo..."}</p>
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-black/60 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-white/60 uppercase tracking-wider">
                  Pre-visualizacao
                </div>
              </div>
            )}

            <div className="space-y-4 p-5">
              <div>
                <FieldLabel required>Titulo</FieldLabel>
                <Input value={heroForm.title} onChange={(v) => setHeroForm({ ...heroForm, title: v })} placeholder="Ex: Copa do Mundo 2026" disabled={heroModal === "view"} />
              </div>

              <div>
                <FieldLabel>Subtitulo</FieldLabel>
                <textarea disabled={heroModal === "view"} value={heroForm.subtitle} onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })} placeholder="Descricao curta que aparece no hero..." rows={2} className="input-dark w-full resize-none px-3 py-2.5 text-sm" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Badge / Etiqueta</FieldLabel>
                  <Input value={heroForm.badge} onChange={(v) => setHeroForm({ ...heroForm, badge: v })} placeholder="EVENTO ESPECIAL" disabled={heroModal === "view"} />
                  <p className="mt-1 text-[10px] text-gray-600">Pode usar emoji + texto</p>
                </div>
                <div>
                  <FieldLabel>Texto do botao CTA</FieldLabel>
                  <Input value={heroForm.ctaText} onChange={(v) => setHeroForm({ ...heroForm, ctaText: v })} placeholder="Assistir Agora" disabled={heroModal === "view"} />
                </div>
              </div>

              <AdminImageField label="Imagem de fundo *" required disabled={heroModal === "view"} value={heroForm.imageUrl} onChange={(v) => setHeroForm({ ...heroForm, imageUrl: v })} aspectClassName="aspect-[16/6]" sizeHint={IMAGE_SIZE_PRESETS.siteBanner} />

              <div>
                <FieldLabel>Link de destino</FieldLabel>
                <Input value={heroForm.linkUrl} onChange={(v) => setHeroForm({ ...heroForm, linkUrl: v })} placeholder="/ao-vivo ou https://..." disabled={heroModal === "view"} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Ordem</FieldLabel>
                  <Input type="number" value={heroForm.sortOrder} onChange={(v) => setHeroForm({ ...heroForm, sortOrder: parseInt(v) || 0 })} disabled={heroModal === "view"} />
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <AdminSelect disabled={heroModal === "view"} value={heroForm.active} onChange={(v) => setHeroForm({ ...heroForm, active: v })} options={activeOptions} />
                </div>
                <div>
                  <FieldLabel>Data de inicio</FieldLabel>
                  <Input type="date" value={heroForm.startDate} onChange={(v) => setHeroForm({ ...heroForm, startDate: v })} disabled={heroModal === "view"} />
                </div>
                <div>
                  <FieldLabel>Data de fim</FieldLabel>
                  <Input type="date" value={heroForm.endDate} onChange={(v) => setHeroForm({ ...heroForm, endDate: v })} disabled={heroModal === "view"} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#1E1E2A] p-5">
              <button onClick={() => setHeroModal(null)} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-5 py-2.5 text-sm text-gray-300 hover:bg-[#1A1A28] hover:text-white transition-colors">
                {heroModal === "view" ? "Fechar" : "Cancelar"}
              </button>
              {heroModal !== "view" && (
                <button onClick={saveHeroSlide} disabled={saving} className="rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-2.5 text-sm font-bold text-white hover:from-[#FF1A24] hover:to-[#E50914] transition-all shadow-[0_4px_16px_rgba(229,9,20,0.3)] disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {heroModal === "edit" ? "Guardar alteracoes" : "Criar Slide"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {bannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                  <Image className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    {bannerModal === "create" ? "Novo Banner" : bannerModal === "edit" ? "Editar Banner" : "Visualizar Banner"}
                  </h3>
                  <p className="text-[11px] text-gray-500">Banner publicitario do site</p>
                </div>
              </div>
              <button onClick={() => setBannerModal(null)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <FieldLabel required>Titulo</FieldLabel>
                <Input value={bannerForm.title} onChange={(v) => setBannerForm({ ...bannerForm, title: v })} disabled={bannerModal === "view"} placeholder="Nome do banner" />
              </div>

              <AdminImageField label="Imagem *" required disabled={bannerModal === "view"} value={bannerForm.imageUrl} onChange={(v) => setBannerForm({ ...bannerForm, imageUrl: v })} aspectClassName="aspect-[16/7]" sizeHint={IMAGE_SIZE_PRESETS.siteBanner} />

              <div>
                <FieldLabel>Link de destino</FieldLabel>
                <Input value={bannerForm.linkUrl} onChange={(v) => setBannerForm({ ...bannerForm, linkUrl: v })} disabled={bannerModal === "view"} placeholder="https://... ou /pagina" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Posicao</FieldLabel>
                  <AdminSelect disabled={bannerModal === "view"} value={bannerForm.position} onChange={(v) => setBannerForm({ ...bannerForm, position: v })} options={positionOptions} />
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <AdminSelect disabled={bannerModal === "view"} value={bannerForm.active} onChange={(v) => setBannerForm({ ...bannerForm, active: v })} options={activeOptions} />
                </div>
                <div>
                  <FieldLabel>Data de inicio</FieldLabel>
                  <Input type="date" value={bannerForm.startDate} onChange={(v) => setBannerForm({ ...bannerForm, startDate: v })} disabled={bannerModal === "view"} />
                </div>
                <div>
                  <FieldLabel>Data de fim</FieldLabel>
                  <Input type="date" value={bannerForm.endDate} onChange={(v) => setBannerForm({ ...bannerForm, endDate: v })} disabled={bannerModal === "view"} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#1E1E2A] p-5">
              <button onClick={() => setBannerModal(null)} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-5 py-2.5 text-sm text-gray-300 hover:bg-[#1A1A28] hover:text-white transition-colors">
                {bannerModal === "view" ? "Fechar" : "Cancelar"}
              </button>
              {bannerModal !== "view" && (
                <button onClick={saveBanner} disabled={saving} className="rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-2.5 text-sm font-bold text-white hover:from-[#FF1A24] hover:to-[#E50914] transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {bannerModal === "edit" ? "Guardar" : "Criar Banner"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
