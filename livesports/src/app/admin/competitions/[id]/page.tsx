"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Competition, SportCategory, CompetitionStatus, CompetitionFormat } from "@/types";

import { getCompetitionTheme, SLUG_THEME_DEFAULTS } from "@/lib/competition-theme";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import CompetitionPageFields, {
  competitionPageFormFromData,
  competitionPagePayload,
  type CompetitionPageForm,
} from "@/components/admin/CompetitionPageFields";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

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

export default function CompetitionEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [saving, setSaving] = useState(false);

  const [pageForm, setPageForm] = useState<CompetitionPageForm>(competitionPageFormFromData({}));

  const [form, setForm] = useState({
    name: "",
    slug: "",
    season: "",
    sport: "football" as SportCategory,
    description: "",
    thumbnail: "",
    banner: "",
    startDate: "",
    endDate: "",
    status: "active" as CompetitionStatus,
    format: "league" as CompetitionFormat,
    themeColor: "#3D195B",
  });

  useEffect(() => {
    if (!params.id) return;
    apiRequest<Competition>(`/competitions/${params.id}`)
      .then((data) => {
        setCompetition(data);
        setForm({
          name: data.name || "",
          slug: data.slug || "",
          season: data.season || "",
          sport: (data.sport as SportCategory) || "football",
          description: data.description || "",
          thumbnail: data.thumbnail || "",
          banner: data.banner || "",
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "",
          status: (data.status as CompetitionStatus) || "active",
          format: (data.format as CompetitionFormat) || "league",
          themeColor: data.themeColor || getCompetitionTheme(data).primary,
        });
        setPageForm(competitionPageFormFromData(data));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Nao foi possivel carregar competicao."));
  }, [params.id]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Preencha nome e slug.");
      return;
    }

    setSaving(true);
    try {
      const pagePayload = competitionPagePayload(pageForm);
      const updated = await apiRequest<Competition>(`/competitions/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          season: form.season || null,
          sport: form.sport || null,
          description: form.description || null,
          thumbnail: form.thumbnail || null,
          banner: form.banner || null,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          status: form.status,
          format: form.format,
          themeColor: form.themeColor || null,
          ...pagePayload,
        }),
      });

      setCompetition(updated);
      setPageForm(competitionPageFormFromData(updated));
      toast.success("Competicao atualizada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nao foi possivel salvar." );
    } finally {
      setSaving(false);
    }
  };

  if (!competition) {
    return <div className="text-sm text-gray-400">A carregar...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{competition.name}</h2>
          <p className="text-xs text-gray-500">Edite os dados da competição.</p>
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
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="input-dark w-full px-3 py-2.5 text-sm"
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
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Formato</label>
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
            Cor predominante do logotipo. Sugestões:{" "}
            {Object.entries(SLUG_THEME_DEFAULTS)
              .slice(0, 4)
              .map(([slug, color]) => `${slug} ${color}`)
              .join(" · ")}
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="input-dark w-full resize-none px-3 py-2.5 text-sm"
          />
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <CompetitionPageFields
            form={pageForm}
            format={form.format}
            onChange={(patch) => setPageForm((prev) => ({ ...prev, ...patch }))}
          />
        </div>

        <div className="mt-5 flex justify-end gap-3 border-t border-white/10 pt-5">
          <button
            onClick={() => router.push(`/admin/competitions/${competition.id}/games`)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10"
          >
            Gerir Jogos
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.slug.trim()}
            className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B00000] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

