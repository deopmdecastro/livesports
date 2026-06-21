"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft } from "lucide-react";
import type { Competition, SportCategory, CompetitionFormat } from "@/types";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminSelect from "@/components/admin/AdminSelect";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";
import { SLUG_THEME_DEFAULTS } from "@/lib/competition-theme";

const sportOptions: { value: SportCategory; label: string }[] = [
  { value: "football", label: "Futebol" },
  { value: "basketball", label: "Basquete" },
  { value: "tennis", label: "Tenis" },
  { value: "ufc", label: "UFC" },
  { value: "f1", label: "Formula 1" },
  { value: "volleyball", label: "Volei" },
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
  { value: "knockout", label: "Eliminatória / Taça", description: "Mata-mata sem tabela (ex: FA Cup, Copa do Brasil)" },
];

export default function CompetitionNewPage() {
  const router = useRouter();

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
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const name = form.name.trim();
    if (!name) return;
    setForm((prev) => ({
      ...prev,
      slug: prev.slug && prev.slug !== "" ? prev.slug : name.toLowerCase().replace(/\s+/g, "-"),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  useEffect(() => {
    const preset = SLUG_THEME_DEFAULTS[form.slug];
    if (!preset) return;
    setForm((prev) => (prev.themeColor === "#3D195B" ? { ...prev, themeColor: preset } : prev));
  }, [form.slug]);

  const canSave = useMemo(() => Boolean(form.name.trim() && form.slug.trim()), [form.name, form.slug]);

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Preencha nome e slug da competicao.");
      return;
    }

    setSaving(true);
    try {
      const created = await apiRequest<Competition>("/competitions", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          season: form.season || null,
          sport: form.sport || null,
          description: form.description || null,
          thumbnail: form.thumbnail || null,
          banner: form.banner || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: form.status,
          format: form.format,
          themeColor: form.themeColor || null,
        }),
      });

      toast.success("Competicao criada!");
      router.push(`/admin/competitions/${created.id}/games`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar competicao.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Nova Competição</h2>
          <p className="text-xs text-gray-500">Crie um torneio para reaproveitar na gestão de jogos e lives.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#171717] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="Ex: Copa do Mundo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Slug *</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="copa-do-mundo"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Temporada</label>
            <input
              value={form.season}
              onChange={(e) => setForm((prev) => ({ ...prev, season: e.target.value }))}
              className="input-dark w-full px-3 py-2.5 text-sm"
              placeholder="2026 / 2025-2026"
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

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Início</label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Fim</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Formato *</label>
            <AdminSelect
              value={form.format}
              onChange={(v) => setForm((prev) => ({ ...prev, format: v as CompetitionFormat }))}
              options={formatOptions.map((o) => ({ value: o.value, label: o.label }))}
              ariaLabel="Selecionar formato"
            />
            <p className="mt-1.5 text-[11px] text-gray-500">
              {formatOptions.find((o) => o.value === form.format)?.description}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Status</label>
            <AdminSelect
              value={form.status}
              onChange={(v) => setForm((prev) => ({ ...prev, status: v as any }))}
              options={statusOptions}
              ariaLabel="Selecionar status"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AdminImageField
            label="Thumbnail (logo)"
            value={form.thumbnail}
            onChange={(v) => setForm((prev) => ({ ...prev, thumbnail: v }))}
            aspectClassName="aspect-square"
            sizeHint={IMAGE_SIZE_PRESETS.competitionLogo}
          />
          <AdminImageField
            label="Banner (hero)"
            value={form.banner}
            onChange={(v) => setForm((prev) => ({ ...prev, banner: v }))}
            aspectClassName="aspect-[3/1]"
            sizeHint={IMAGE_SIZE_PRESETS.competitionBanner}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Cor da competição</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.themeColor}
              onChange={(e) => setForm((prev) => ({ ...prev, themeColor: e.target.value.toUpperCase() }))}
              className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
            />
            <input
              value={form.themeColor}
              onChange={(e) => setForm((prev) => ({ ...prev, themeColor: e.target.value }))}
              className="input-dark flex-1 px-3 py-2.5 text-sm font-mono uppercase"
              placeholder="#3D195B"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500">
            Cor predominante do logotipo (ex: UCL azul #0A1D56, Bundesliga vermelho #D20515).
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="input-dark w-full resize-none px-3 py-2.5 text-sm"
            placeholder="Descrição da competição"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3 border-t border-white/10 pt-5">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B00000] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : (
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Criar
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

