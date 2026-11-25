"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Trophy, Calendar, Image as ImageIcon, Sparkles } from "lucide-react";
import type { Competition, SportCategory, CompetitionFormat } from "@/types";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminSelect from "@/components/admin/AdminSelect";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";
import { SLUG_THEME_DEFAULTS } from "@/lib/competition-theme";
import { cn } from "@/utils";

const sportOptions: { value: SportCategory; label: string }[] = [
  { value: "football", label: "Futebol" },
  { value: "basketball", label: "Basquete" },
  { value: "tennis", label: "Tênis" },
  { value: "ufc", label: "UFC" },
  { value: "f1", label: "Fórmula 1" },
  { value: "volleyball", label: "Vólei" },
  { value: "baseball", label: "Beisebol" },
  { value: "other", label: "Outros" },
];

const statusOptions = [
  { value: "active", label: "Ativa" },
  { value: "draft", label: "Rascunho" },
  { value: "completed", label: "Concluída" },
];

const formatOptions: { value: CompetitionFormat; label: string; description: string }[] = [
  { value: "groups", label: "Grupos", description: "Fase de grupos (ex: Copa do Mundo, Champions League)" },
  { value: "league", label: "Liga / Tabela", description: "Classificação única (ex: Premier League, La Liga)" },
  { value: "knockout", label: "Eliminatória / Taça", description: "Mata-mata sem tabela (ex: FA Cup)" },
];

const STEPS = [
  { key: "basic", label: "Identidade", icon: Trophy },
  { key: "schedule", label: "Calendário", icon: Calendar },
  { key: "media", label: "Média & Destaque", icon: ImageIcon },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export default function CompetitionNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>("basic");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    slug: string;
    season: string;
    sport: SportCategory | "";
    description: string;
    thumbnail: string;
    banner: string;
    startDate: string;
    endDate: string;
    status: "active" | "draft" | "completed";
    format: CompetitionFormat;
    themeColor: string;
    isFeaturedCard: boolean;
  }>({
    name: "",
    slug: "",
    season: "",
    sport: "football",
    description: "",
    thumbnail: "",
    banner: "",
    startDate: "",
    endDate: "",
    status: "active",
    format: "league",
    themeColor: "#3D195B",
    isFeaturedCard: false,
  });

  useEffect(() => {
    const name = form.name.trim();
    if (!name) return;
    setForm((prev) => ({
      ...prev,
      slug: prev.slug && prev.slug !== "" ? prev.slug : name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  }, [form.name]);

  useEffect(() => {
    const preset = SLUG_THEME_DEFAULTS[form.slug];
    if (!preset) return;
    setForm((prev) => (prev.themeColor === "#3D195B" ? { ...prev, themeColor: preset } : prev));
  }, [form.slug]);

  const canSave = useMemo(() => Boolean(form.name.trim() && form.slug.trim()), [form.name, form.slug]);
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const goNext = () => {
    if (step === "basic" && !canSave) {
      toast.error("Preencha o nome e o slug da competição.");
      return;
    }
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].key);
  };

  const goPrev = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key);
  };

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Preencha o nome e o slug da competição.");
      setStep("basic");
      return;
    }

    setSaving(true);
    try {
      const created = await apiRequest<Competition>("/competitions", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          season: form.season || null,
          sport: form.sport || "football",
          description: form.description || null,
          thumbnail: form.thumbnail || null,
          banner: form.banner || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: form.status,
          format: form.format,
          themeColor: form.themeColor || null,
          isFeaturedCard: form.isFeaturedCard,
        }),
      });
      toast.success("Competição criada!");
      router.push(`/admin/competitions/${created.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a competição.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Nova Competição / Liga</h2>
          <p className="mt-1 text-sm text-gray-500">
            Crie um torneio para reutilizar em eventos, jogos e lives.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>

      {/* Steps */}
      <div className="rounded-2xl border border-white/10 bg-[#121218] p-3 sm:p-4">
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#E50914] transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = s.key === step;
            const done = i < stepIndex;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(s.key)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition-all",
                  active && "bg-[#E50914]/15 text-[#ff6b73] ring-1 ring-[#E50914]/25",
                  done && !active && "bg-emerald-500/10 text-emerald-400",
                  !active && !done && "bg-white/[0.03] text-gray-500"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#171717] p-4 sm:p-6">
        {step === "basic" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  placeholder="Ex: Premier League"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Slug *</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="input-dark w-full px-3 py-2.5 text-sm font-mono"
                  placeholder="premier-league"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Temporada</label>
                <input
                  value={form.season}
                  onChange={(e) => setForm((prev) => ({ ...prev, season: e.target.value }))}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  placeholder="2025-2026"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Desporto</label>
                <AdminSelect
                  value={form.sport}
                  onChange={(v) => setForm((prev) => ({ ...prev, sport: v as SportCategory }))}
                  options={sportOptions}
                  ariaLabel="Selecionar desporto"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-300">Formato da competição</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {formatOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, format: opt.value }))}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      form.format === opt.value
                        ? "border-[#E50914]/40 bg-[#E50914]/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    )}
                  >
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                    <p className="mt-1 text-[11px] leading-snug text-gray-500">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">Estado</label>
              <AdminSelect
                value={form.status}
                onChange={(v) => setForm((prev) => ({ ...prev, status: v as typeof form.status }))}
                options={statusOptions}
                ariaLabel="Estado"
              />
            </div>
          </div>
        )}

        {step === "schedule" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Data de início</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Data de fim</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={5}
                className="input-dark w-full resize-none px-3 py-2.5 text-sm"
                placeholder="Resumo da competição, regulamento, fases..."
              />
            </div>
          </div>
        )}

        {step === "media" && (
          <div className="space-y-4">
            <AdminImageField
              label="Thumbnail / logo"
              value={form.thumbnail}
              onChange={(v) => setForm((prev) => ({ ...prev, thumbnail: v }))}
              sizeHint={IMAGE_SIZE_PRESETS.eventThumbnail}
            />
            <AdminImageField
              label="Banner"
              value={form.banner}
              onChange={(v) => setForm((prev) => ({ ...prev, banner: v }))}
              aspectClassName="aspect-[21/9]"
              sizeHint={IMAGE_SIZE_PRESETS.siteBanner}
            />
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">Cor do tema</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.themeColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, themeColor: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <input
                  value={form.themeColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, themeColor: e.target.value }))}
                  className="input-dark flex-1 px-3 py-2.5 font-mono text-sm"
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <button
                type="button"
                role="switch"
                aria-checked={form.isFeaturedCard}
                onClick={() => setForm((prev) => ({ ...prev, isFeaturedCard: !prev.isFeaturedCard }))}
                className={cn(
                  "relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
                  form.isFeaturedCard ? "bg-[#E50914]" : "bg-white/15"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    form.isFeaturedCard ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-amber-300" /> Destacar no card da homepage
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Apenas uma competição pode ficar em destaque de cada vez.
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => (stepIndex === 0 ? router.back() : goPrev())}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10"
          >
            {stepIndex === 0 ? "Cancelar" : "Anterior"}
          </button>
          <div className="flex gap-2">
            {stepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15 sm:flex-none"
              >
                Seguinte
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E50914] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#B00000] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              {saving ? "A criar…" : "Criar competição"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
