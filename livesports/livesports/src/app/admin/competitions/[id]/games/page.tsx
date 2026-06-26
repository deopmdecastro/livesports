"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Edit2, Eye, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { Competition, Event, SportCategory } from "@/types";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";
import AdminActionButton from "@/components/admin/AdminActionButton";
import AdminTeamMark from "@/components/admin/AdminTeamMark";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import AdminSelect from "@/components/admin/AdminSelect";
import { formatDateTime } from "@/utils";

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
  { value: "upcoming", label: "Agendado" },
  { value: "live", label: "Ao vivo" },
  { value: "finished", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
];

export default function CompetitionGamesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Event | null>(null);

  const emptyForm = {
    title: "",
    description: "",
    sport: (competition?.sport as SportCategory) || "football",
    league: "",
    leagueLogo: "",
    teamA: "",
    teamACode: "",
    teamALogo: "",
    teamB: "",
    teamBCode: "",
    teamBLogo: "",
    venue: "",
    scoreA: "",
    scoreB: "",
    matchTime: "",
    viewerCount: "",
    scheduledAt: new Date().toISOString().slice(0, 16),
    status: "upcoming",
    thumbnail: "",
    // Competition fields
    competitionId: competition?.id || params.id,
    stage: "",
    roundNumber: "",
    groupName: "",
    matchNumber: "",
  };

  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => {
    const cid = params.id;
    if (!cid) return;

    Promise.all([
      apiRequest<Competition>(`/competitions/${cid}`),
      apiRequest<Event[]>(`/events?competitionId=${encodeURIComponent(cid)}&limit=200`),
    ])
      .then(([comp, evs]) => {
        setCompetition(comp);
        setEvents(evs || []);
        setLoading(false);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Erro ao carregar jogos." );
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (!competition) return;
    setForm((prev: any) => ({
      ...prev,
      sport: (competition.sport as SportCategory) || "football",
      competitionId: competition.id,
    }));
  }, [competition]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => [e.title, e.league || "", e.teamA || "", e.teamB || ""].some((v) => (v || "").toLowerCase().includes(q)));
  }, [events, search]);

  const openCreate = () => {
    setSelected(null);
    setModalMode("create");
    setForm({
      ...emptyForm,
      competitionId: params.id,
      scheduledAt: new Date().toISOString().slice(0, 16),
      sport: (competition?.sport as SportCategory) || "football",
    });
  };

  const openModal = (mode: "edit" | "view", event: Event) => {
    setSelected(event);
    setModalMode(mode);
    setForm({
      ...emptyForm,
      title: event.title || "",
      description: event.description || "",
      sport: event.sport,
      league: event.league || "",
      leagueLogo: event.leagueLogo || "",
      teamA: event.teamA || "",
      teamACode: event.teamACode || "",
      teamALogo: event.teamALogo || "",
      teamB: event.teamB || "",
      teamBCode: event.teamBCode || "",
      teamBLogo: event.teamBLogo || "",
      venue: event.venue || "",
      scoreA: typeof event.scoreA === "number" ? String(event.scoreA) : "",
      scoreB: typeof event.scoreB === "number" ? String(event.scoreB) : "",
      matchTime: event.matchTime || "",
      viewerCount: typeof event.viewerCount === "number" ? String(event.viewerCount) : "",
      scheduledAt: event.scheduledAt ? String(event.scheduledAt).slice(0, 16) : new Date().toISOString().slice(0, 16),
      status: event.status,
      thumbnail: event.thumbnail || "",
      competitionId: (event as any).competitionId || params.id,
      stage: (event as any).stage || "",
      roundNumber: (event as any).roundNumber != null ? String((event as any).roundNumber) : "",
      groupName: (event as any).groupName || "",
      matchNumber: (event as any).matchNumber != null ? String((event as any).matchNumber) : "",
    });
  };

  const saveEvent = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o título do jogo.");
      return;
    }

    const payload: any = {
      title: form.title,
      description: form.description || null,
      thumbnail: form.thumbnail || null,
      sport: form.sport,
      league: form.league || null,
      leagueLogo: form.leagueLogo || null,
      teamA: form.teamA || null,
      teamACode: form.teamACode || null,
      teamALogo: form.teamALogo || null,
      teamB: form.teamB || null,
      teamBCode: form.teamBCode || null,
      teamBLogo: form.teamBLogo || null,
      venue: form.venue || null,
      scoreA: form.scoreA === "" ? null : Number(form.scoreA),
      scoreB: form.scoreB === "" ? null : Number(form.scoreB),
      matchTime: form.matchTime || null,
      viewerCount: form.viewerCount === "" ? 0 : Number(form.viewerCount),
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : new Date().toISOString(),
      status: form.status,
      competitionId: form.competitionId || params.id,
      stage: form.stage || null,
      roundNumber: form.roundNumber === "" ? null : Number(form.roundNumber),
      groupName: form.groupName || null,
      matchNumber: form.matchNumber === "" ? null : Number(form.matchNumber),
    };

    try {
      if (modalMode === "edit" && selected) {
        const updated = await apiRequest<Event>(`/events/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setEvents((cur) => cur.map((e) => (e.id === selected.id ? updated : e)));
        toast.success("Jogo atualizado!");
      } else {
        const created = await apiRequest<Event>("/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setEvents((cur) => [created, ...cur]);
        toast.success("Jogo criado!");
      }
      setModalMode(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nao foi possivel salvar jogo." );
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await apiRequest(`/events/${eventId}`, { method: "DELETE" });
      setEvents((cur) => cur.filter((e) => e.id !== eventId));
      toast.success("Jogo removido!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nao foi possivel remover." );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Jogos · {competition?.name || "Competição"}</h2>
          <p className="text-xs text-gray-500">Gerencie os jogos (events) vinculados a esta competição.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]"
          >
            <Plus className="h-4 w-4" /> Novo Jogo
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const evs = await apiRequest<Event[]>(`/events?competitionId=${encodeURIComponent(params.id)}&limit=200`);
                setEvents(evs || []);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro ao recarregar." );
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/90 hover:bg-white/10"
          >
            <RefreshCw className={"h-4 w-4"} /> Recarregar
          </button>
          <button
            onClick={() => router.push(`/admin/competitions/${params.id}`)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/90 hover:bg-white/10"
          >
            Gerir Competição
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#171717] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar jogos..."
            className="input-dark w-full pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="text-xs text-gray-400">
          {loading ? "A carregar..." : `${filtered.length} resultado(s)`}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#171717]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-white/[0.02]">
                {["Jogo", "Liga", "Desporto", "Data", "Status", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="table-row-hover border-t border-white/10">
                  <td className="px-4 py-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <AdminTeamMark logo={event.teamALogo} name={event.teamA} code={event.teamACode} size={32} />
                      <span>{event.teamA && event.teamB ? `${event.teamA} vs ${event.teamB}` : event.title}</span>
                      <AdminTeamMark logo={event.teamBLogo} name={event.teamB} code={event.teamBCode} size={32} />
                    </p>
                    <p className="text-xs text-gray-400">{event.stage ? `Fase: ${event.stage}` : event.title}</p>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-gray-300">
                    {event.league || "-"}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-300">{event.sport}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-400">{formatDateTime(event.scheduledAt)}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-gray-300">{event.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <AdminActionButton title="Visualizar" onClick={() => openModal("view", event)} tone="view">
                        <Eye className="h-4 w-4" />
                      </AdminActionButton>
                      <AdminActionButton title="Editar" onClick={() => openModal("edit", event)} tone="edit">
                        <Edit2 className="h-4 w-4" />
                      </AdminActionButton>
                      <AdminActionButton title="Remover" onClick={() => deleteEvent(event.id)} tone="danger">
                        <Trash2 className="h-4 w-4" />
                      </AdminActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-gray-400">Nenhum jogo encontrado.</div>
          )}
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#171717] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h3 className="text-lg font-bold text-white">
                {modalMode === "create" ? "Novo Jogo" : modalMode === "edit" ? "Editar Jogo" : "Visualizar Jogo"}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Título</label>
                <input
                  value={form.title}
                  disabled={modalMode === "view"}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, title: e.target.value }))}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                />
              </div>

              <AdminImageField
                label="Capa"
                value={form.thumbnail}
                disabled={modalMode === "view"}
                onChange={(v) => setForm((prev: any) => ({ ...prev, thumbnail: v }))}
                aspectClassName="aspect-video"
                sizeHint={IMAGE_SIZE_PRESETS.eventThumbnail}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Desporto</label>
                  <AdminSelect
                    disabled={modalMode === "view"}
                    value={form.sport}
                    onChange={(v) => setForm((prev: any) => ({ ...prev, sport: v }))}
                    options={sportOptions}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Status</label>
                  <AdminSelect
                    disabled={modalMode === "view"}
                    value={form.status}
                    onChange={(v) => setForm((prev: any) => ({ ...prev, status: v }))}
                    options={statusOptions}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Liga</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.league}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, league: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Tempo</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.matchTime}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, matchTime: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="75' / Q4"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Time A</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.teamA}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, teamA: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Código Time A</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.teamACode}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, teamACode: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="BRA"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Time B</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.teamB}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, teamB: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Código Time B</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.teamBCode}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, teamBCode: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="ARG"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminImageField
                  label="Bandeira / logo Time A"
                  value={form.teamALogo}
                  disabled={modalMode === "view"}
                  onChange={(v) => setForm((prev: any) => ({ ...prev, teamALogo: v }))}
                  aspectClassName="aspect-square"
                  sizeHint={IMAGE_SIZE_PRESETS.teamLogo}
                />
                <AdminImageField
                  label="Bandeira / logo Time B"
                  value={form.teamBLogo}
                  disabled={modalMode === "view"}
                  onChange={(v) => setForm((prev: any) => ({ ...prev, teamBLogo: v }))}
                  aspectClassName="aspect-square"
                  sizeHint={IMAGE_SIZE_PRESETS.teamLogo}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Placar A</label>
                  <input
                    disabled={modalMode === "view"}
                    type="number"
                    value={form.scoreA}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, scoreA: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Placar B</label>
                  <input
                    disabled={modalMode === "view"}
                    type="number"
                    value={form.scoreB}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, scoreB: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Data e hora</label>
                  <input
                    type="datetime-local"
                    disabled={modalMode === "view"}
                    value={form.scheduledAt}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, scheduledAt: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Espectadores</label>
                  <input
                    disabled={modalMode === "view"}
                    type="number"
                    value={form.viewerCount}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, viewerCount: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Estádio / local</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.venue}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, venue: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="MetLife Stadium, Nova Jersey"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Fase</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.stage}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, stage: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="Grupo C"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Grupo</label>
                  <input
                    disabled={modalMode === "view"}
                    value={form.groupName}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, groupName: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="A / B / C"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Rodada</label>
                  <input
                    disabled={modalMode === "view"}
                    type="number"
                    value={form.roundNumber}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, roundNumber: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Número do jogo</label>
                  <input
                    disabled={modalMode === "view"}
                    type="number"
                    value={form.matchNumber}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, matchNumber: e.target.value }))}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Descrição</label>
                <textarea
                  disabled={modalMode === "view"}
                  value={form.description}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="input-dark w-full resize-none px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 p-5">
                <button
                  onClick={() => setModalMode(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10"
                >
                  Cancelar
                </button>
                {modalMode !== "view" && (
                  <button
                    onClick={saveEvent}
                    className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]"
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

