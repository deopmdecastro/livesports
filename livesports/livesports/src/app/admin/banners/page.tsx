"use client";

import { useState } from "react";
import {
  Edit2, Eye, Image, Plus, Search, Trash2, X, Monitor,
  LayoutTemplate, ExternalLink, Calendar, ToggleLeft, ToggleRight,
  GripVertical, Info, Sparkles,
} from "lucide-react";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import AdminActionButton from "@/components/admin/AdminActionButton";
import type { Banner } from "@/types";
import toast from "react-hot-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  linkUrl: string;
  ctaText: string;
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const positionOptions = [
  { value: "hero", label: "Hero principal" },
  { value: "sidebar", label: "Sidebar" },
  { value: "in-content", label: "Entre conteúdos" },
];

const activeOptions = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

// ─── Initial data ──────────────────────────────────────────────────────────────

const initialBanners: Banner[] = [
  {
    id: "1",
    title: "Champions League Final",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80",
    linkUrl: "/ao-vivo",
    position: "hero",
    active: true,
    startDate: "2026-06-10",
    endDate: "2026-06-30",
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "2",
    title: "NBA Finals Countdown",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80",
    linkUrl: "/basquete",
    position: "in-content",
    active: true,
    startDate: "2026-06-11",
    endDate: "2026-06-20",
    createdAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "3",
    title: "F1 GP Weekend",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
    linkUrl: "/f1",
    position: "sidebar",
    active: false,
    createdAt: "2026-06-03T10:00:00.000Z",
  },
];

const initialHeroSlides: HeroSlide[] = [
  {
    id: "hs1",
    title: "Copa do Mundo 2026",
    subtitle: "O maior torneio de futebol do planeta começa em breve. Não percas nenhum jogo.",
    badge: "🏆 EVENTO ESPECIAL",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80",
    linkUrl: "/copa-do-mundo",
    ctaText: "Ver Calendário",
    active: true,
    order: 1,
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "hs2",
    title: "Champions League — Temporada 2025/26",
    subtitle: "Os maiores clubes da Europa em busca do título supremo.",
    badge: "⭐ EM DESTAQUE",
    imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1600&q=80",
    linkUrl: "/futebol",
    ctaText: "Assistir Agora",
    active: true,
    order: 2,
    createdAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "hs3",
    title: "NBA Playoffs 2026",
    subtitle: "Cada jogo decide o campeão. Segue cada lance ao vivo.",
    badge: "🏀 BASQUETE",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=80",
    linkUrl: "/basquete",
    ctaText: "Ver Jogos",
    active: false,
    order: 3,
    createdAt: "2026-06-03T10:00:00.000Z",
  },
];

// ─── Hero Slide Form ───────────────────────────────────────────────────────────

const emptyHeroForm = {
  title: "",
  subtitle: "",
  badge: "",
  imageUrl: "",
  linkUrl: "",
  ctaText: "Assistir Agora",
  active: "true",
  startDate: "",
  endDate: "",
};

// ─── Banner Form ───────────────────────────────────────────────────────────────

const emptyBannerForm = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  position: "hero",
  active: "true",
  startDate: "",
  endDate: "",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Hero / Carrossel", "Banners do Site"] as const;
type Tab = typeof TABS[number];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BannersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Hero / Carrossel");

  // ── Hero Slides state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(initialHeroSlides);
  const [heroSearch, setHeroSearch] = useState("");
  const [heroModal, setHeroModal] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedHero, setSelectedHero] = useState<HeroSlide | null>(null);
  const [heroForm, setHeroForm] = useState(emptyHeroForm);

  // ── Banners state
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [bannerSearch, setBannerSearch] = useState("");
  const [bannerModal, setBannerModal] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);

  // ── Hero slide handlers
  const openCreateHero = () => {
    setSelectedHero(null);
    setHeroForm(emptyHeroForm);
    setHeroModal("create");
  };

  const openHeroModal = (mode: "edit" | "view", slide: HeroSlide) => {
    setSelectedHero(slide);
    setHeroForm({
      title: slide.title,
      subtitle: slide.subtitle,
      badge: slide.badge,
      imageUrl: slide.imageUrl,
      linkUrl: slide.linkUrl,
      ctaText: slide.ctaText,
      active: String(slide.active),
      startDate: slide.startDate || "",
      endDate: slide.endDate || "",
    });
    setHeroModal(mode);
  };

  const saveHeroSlide = () => {
    if (!heroForm.title.trim() || !heroForm.imageUrl.trim()) {
      toast.error("Informe título e imagem do slide.");
      return;
    }
    const payload = {
      title: heroForm.title,
      subtitle: heroForm.subtitle,
      badge: heroForm.badge,
      imageUrl: heroForm.imageUrl,
      linkUrl: heroForm.linkUrl,
      ctaText: heroForm.ctaText,
      active: heroForm.active === "true",
      startDate: heroForm.startDate || undefined,
      endDate: heroForm.endDate || undefined,
    };
    if (heroModal === "edit" && selectedHero) {
      setHeroSlides((prev) =>
        prev.map((s) => s.id === selectedHero.id ? { ...s, ...payload } : s)
      );
      toast.success("Slide do Hero atualizado!");
    } else {
      const maxOrder = heroSlides.reduce((m, s) => Math.max(m, s.order), 0);
      setHeroSlides((prev) => [
        ...prev,
        { id: Date.now().toString(), ...payload, order: maxOrder + 1, createdAt: new Date().toISOString() },
      ]);
      toast.success("Slide do Hero criado!");
    }
    setHeroModal(null);
  };

  const toggleHeroActive = (id: string) => {
    setHeroSlides((prev) =>
      prev.map((s) => s.id === id ? { ...s, active: !s.active } : s)
    );
  };

  const deleteHeroSlide = (id: string) => {
    setHeroSlides((prev) => prev.filter((s) => s.id !== id));
    toast.success("Slide removido!");
  };

  // ── Banner handlers
  const openCreateBanner = () => {
    setSelectedBanner(null);
    setBannerForm(emptyBannerForm);
    setBannerModal("create");
  };

  const openBannerModal = (mode: "edit" | "view", banner: Banner) => {
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

  const saveBanner = () => {
    if (!bannerForm.title.trim() || !bannerForm.imageUrl.trim()) {
      toast.error("Informe título e imagem.");
      return;
    }
    const payload = {
      title: bannerForm.title,
      imageUrl: bannerForm.imageUrl,
      linkUrl: bannerForm.linkUrl,
      position: bannerForm.position as Banner["position"],
      active: bannerForm.active === "true",
      startDate: bannerForm.startDate,
      endDate: bannerForm.endDate,
    };
    if (bannerModal === "edit" && selectedBanner) {
      setBanners((prev) => prev.map((b) => b.id === selectedBanner.id ? { ...b, ...payload } : b));
      toast.success("Banner atualizado!");
    } else {
      setBanners((prev) => [{ id: Date.now().toString(), ...payload, createdAt: new Date().toISOString() }, ...prev]);
      toast.success("Banner criado!");
    }
    setBannerModal(null);
  };

  const filteredHero = heroSlides.filter((s) =>
    s.title.toLowerCase().includes(heroSearch.toLowerCase())
  );

  const filteredBanners = banners.filter((b) =>
    b.title.toLowerCase().includes(bannerSearch.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Gestão Visual
            </div>
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Banners & Hero
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Gere os slides do Hero (carrossel da página inicial) e banners publicitários do site.
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

        {/* Tabs */}
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

      {/* ── TAB: HERO SLIDES ────────────────────────────────────────────────────── */}
      {activeTab === "Hero / Carrossel" && (
        <div className="space-y-4">
          {/* Info box */}
          <div className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-300 leading-relaxed">
              <strong className="text-blue-200">Como funciona:</strong> Estes slides aparecem no carrossel principal da landing page
              <strong className="text-white"> quando não há lives ao vivo ou em destaque</strong>.
              Ordene-os por prioridade — o slide com menor número de ordem aparece primeiro.
            </div>
          </div>

          {/* Toolbar */}
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

          {/* Hero slides grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredHero
              .sort((a, b) => a.order - b.order)
              .map((slide) => (
                <div
                  key={slide.id}
                  className={`group overflow-hidden rounded-2xl border transition-all ${
                    slide.active
                      ? "border-[#E50914]/25 bg-[#0E0E16] hover:border-[#E50914]/50"
                      : "border-[#1E1E2A] bg-[#0A0A0F] opacity-60 hover:opacity-80"
                  }`}
                >
                  {/* Preview Image */}
                  <div className="relative aspect-[16/7] overflow-hidden bg-[#111118]">
                    <img
                      src={slide.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {/* Slide content preview */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {slide.badge && (
                        <span className="mb-1 inline-block rounded-full bg-[#E50914]/90 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-widest">
                          {slide.badge}
                        </span>
                      )}
                      <p className="text-sm font-black text-white leading-tight line-clamp-1">{slide.title}</p>
                      {slide.subtitle && (
                        <p className="mt-0.5 text-[10px] text-white/60 line-clamp-1">{slide.subtitle}</p>
                      )}
                    </div>
                    {/* Order badge */}
                    <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[10px] font-black text-white border border-white/10">
                      {slide.order}
                    </div>
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleHeroActive(slide.id)}
                      className="absolute top-2 right-2"
                      title={slide.active ? "Desativar" : "Ativar"}
                    >
                      {slide.active
                        ? <ToggleRight className="h-6 w-6 text-emerald-400 drop-shadow-md" />
                        : <ToggleLeft className="h-6 w-6 text-gray-500" />}
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <StatusBadge active={slide.active} />
                      {slide.linkUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                          <ExternalLink className="h-2.5 w-2.5" />
                          {slide.ctaText}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-white truncate">{slide.title}</p>
                    {slide.subtitle && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">{slide.subtitle}</p>
                    )}
                    {(slide.startDate || slide.endDate) && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {slide.startDate && <span>De {slide.startDate}</span>}
                        {slide.endDate && <span>até {slide.endDate}</span>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                        <GripVertical className="h-3.5 w-3.5" />
                        <span>Ordem #{slide.order}</span>
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

      {/* ── TAB: BANNERS ─────────────────────────────────────────────────────────── */}
      {activeTab === "Banners do Site" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total", value: banners.length, color: "text-white" },
              { label: "Ativos", value: banners.filter((b) => b.active).length, color: "text-emerald-400" },
              { label: "Hero", value: banners.filter((b) => b.position === "hero").length, color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={bannerSearch}
                onChange={(e) => setBannerSearch(e.target.value)}
                placeholder="Pesquisar banners..."
                className="input-dark w-full py-2.5 pl-9 pr-4 text-sm"
              />
            </div>
            <button
              onClick={openCreateBanner}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-sm font-bold text-white hover:from-[#FF1A24] hover:to-[#E50914] transition-all shadow-[0_4px_20px_rgba(229,9,20,0.3)]"
            >
              <Plus className="h-4 w-4" />
              Novo Banner
            </button>
          </div>

          {/* Banners grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBanners.map((banner) => (
              <div
                key={banner.id}
                className="group overflow-hidden rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] hover:border-[#E50914]/25 transition-all"
              >
                <div className="aspect-[16/7] bg-[#111118] overflow-hidden">
                  <img
                    src={banner.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <StatusBadge active={banner.active} />
                    <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
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
                    <AdminActionButton
                      title="Remover"
                      onClick={() => {
                        setBanners((prev) => prev.filter((b) => b.id !== banner.id));
                        toast.success("Banner removido!");
                      }}
                      tone="danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </AdminActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HERO SLIDE MODAL ────────────────────────────────────────────────────── */}
      {heroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            {/* Modal header */}
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

            {/* Live preview strip */}
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
                  <p className="text-sm font-black text-white leading-tight line-clamp-1">
                    {heroForm.title || "Título do slide..."}
                  </p>
                  <p className="text-[10px] text-white/60 mt-0.5 line-clamp-1">
                    {heroForm.subtitle || "Subtítulo..."}
                  </p>
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-black/60 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-white/60 uppercase tracking-wider">
                  Pré-visualização
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4 p-5">
              <div>
                <FieldLabel required>Título</FieldLabel>
                <Input
                  value={heroForm.title}
                  onChange={(v) => setHeroForm({ ...heroForm, title: v })}
                  placeholder="Ex: Copa do Mundo 2026"
                  disabled={heroModal === "view"}
                />
              </div>

              <div>
                <FieldLabel>Subtítulo</FieldLabel>
                <textarea
                  disabled={heroModal === "view"}
                  value={heroForm.subtitle}
                  onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                  placeholder="Descrição curta que aparece no hero..."
                  rows={2}
                  className="input-dark w-full resize-none px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Badge / Etiqueta</FieldLabel>
                  <Input
                    value={heroForm.badge}
                    onChange={(v) => setHeroForm({ ...heroForm, badge: v })}
                    placeholder="🏆 EVENTO ESPECIAL"
                    disabled={heroModal === "view"}
                  />
                  <p className="mt-1 text-[10px] text-gray-600">Pode usar emoji + texto</p>
                </div>
                <div>
                  <FieldLabel>Texto do botão CTA</FieldLabel>
                  <Input
                    value={heroForm.ctaText}
                    onChange={(v) => setHeroForm({ ...heroForm, ctaText: v })}
                    placeholder="Assistir Agora"
                    disabled={heroModal === "view"}
                  />
                </div>
              </div>

              <AdminImageField
                label="Imagem de fundo *"
                required
                disabled={heroModal === "view"}
                value={heroForm.imageUrl}
                onChange={(v) => setHeroForm({ ...heroForm, imageUrl: v })}
                aspectClassName="aspect-[16/6]"
                sizeHint={IMAGE_SIZE_PRESETS.siteBanner}
              />

              <div>
                <FieldLabel>Link de destino</FieldLabel>
                <Input
                  value={heroForm.linkUrl}
                  onChange={(v) => setHeroForm({ ...heroForm, linkUrl: v })}
                  placeholder="/ao-vivo ou https://..."
                  disabled={heroModal === "view"}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <AdminSelect
                    disabled={heroModal === "view"}
                    value={heroForm.active}
                    onChange={(v) => setHeroForm({ ...heroForm, active: v })}
                    options={activeOptions}
                  />
                </div>
                <div>{/* spacer */}</div>
                <div>
                  <FieldLabel>Data de início</FieldLabel>
                  <Input
                    type="date"
                    value={heroForm.startDate}
                    onChange={(v) => setHeroForm({ ...heroForm, startDate: v })}
                    disabled={heroModal === "view"}
                  />
                </div>
                <div>
                  <FieldLabel>Data de fim</FieldLabel>
                  <Input
                    type="date"
                    value={heroForm.endDate}
                    onChange={(v) => setHeroForm({ ...heroForm, endDate: v })}
                    disabled={heroModal === "view"}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-[#1E1E2A] p-5">
              <button
                onClick={() => setHeroModal(null)}
                className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-5 py-2.5 text-sm text-gray-300 hover:bg-[#1A1A28] hover:text-white transition-colors"
              >
                {heroModal === "view" ? "Fechar" : "Cancelar"}
              </button>
              {heroModal !== "view" && (
                <button
                  onClick={saveHeroSlide}
                  className="rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-2.5 text-sm font-bold text-white hover:from-[#FF1A24] hover:to-[#E50914] transition-all shadow-[0_4px_16px_rgba(229,9,20,0.3)]"
                >
                  {heroModal === "edit" ? "Guardar alterações" : "Criar Slide"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BANNER MODAL ──────────────────────────────────────────────────────────── */}
      {bannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Image className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    {bannerModal === "create" ? "Novo Banner" : bannerModal === "edit" ? "Editar Banner" : "Visualizar Banner"}
                  </h3>
                  <p className="text-[11px] text-gray-500">Banner publicitário do site</p>
                </div>
              </div>
              <button onClick={() => setBannerModal(null)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <FieldLabel required>Título</FieldLabel>
                <Input
                  value={bannerForm.title}
                  onChange={(v) => setBannerForm({ ...bannerForm, title: v })}
                  disabled={bannerModal === "view"}
                  placeholder="Nome do banner"
                />
              </div>

              <AdminImageField
                label="Imagem *"
                required
                disabled={bannerModal === "view"}
                value={bannerForm.imageUrl}
                onChange={(v) => setBannerForm({ ...bannerForm, imageUrl: v })}
                aspectClassName="aspect-[16/7]"
                sizeHint={IMAGE_SIZE_PRESETS.siteBanner}
              />

              <div>
                <FieldLabel>Link de destino</FieldLabel>
                <Input
                  value={bannerForm.linkUrl}
                  onChange={(v) => setBannerForm({ ...bannerForm, linkUrl: v })}
                  disabled={bannerModal === "view"}
                  placeholder="https://... ou /pagina"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Posição</FieldLabel>
                  <AdminSelect
                    disabled={bannerModal === "view"}
                    value={bannerForm.position}
                    onChange={(v) => setBannerForm({ ...bannerForm, position: v })}
                    options={positionOptions}
                  />
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <AdminSelect
                    disabled={bannerModal === "view"}
                    value={bannerForm.active}
                    onChange={(v) => setBannerForm({ ...bannerForm, active: v })}
                    options={activeOptions}
                  />
                </div>
                <div>
                  <FieldLabel>Data de início</FieldLabel>
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
                <button onClick={saveBanner} className="rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-2.5 text-sm font-bold text-white hover:from-[#FF1A24] hover:to-[#E50914] transition-all">
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
