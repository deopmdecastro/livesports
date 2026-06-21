"use client";

import { useEffect, useState } from "react";
import { Calendar, Download, Edit2, Eye, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { formatDateTime } from "@/utils";
import type { Event, SportCategory } from "@/types";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import AdminActionButton from "@/components/admin/AdminActionButton";
import AdminTeamMark, { isLeagueLogoDisplayable } from "@/components/admin/AdminTeamMark";
import { AdminTeamSearchField } from "@/components/thesportsdb/TeamSearch";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

const sportOptions = [
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

const emptyForm = {
  title: "",
  description: "",
  sport: "football",
  league: "",
  leagueLogo: "",
  teamA: "",
  teamALogo: "",
  teamB: "",
  teamBLogo: "",
  scoreA: "",
  scoreB: "",
  matchTime: "",
  viewerCount: "",
  scheduledAt: "",
  status: "upcoming",
  thumbnail: "",
};


export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [importing, setImporting] = useState(false);
  const [syncingLive, setSyncingLive] = useState(false);
  const [importingCalendar, setImportingCalendar] = useState(false);

  const filtered = events.filter((event) =>
    [event.title, event.league || "", event.teamA || "", event.teamB || ""].some((value) => value.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    apiRequest<Event[]>("/events")
      .then(setEvents)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar eventos."))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setSelected(null);
    setForm({ ...emptyForm, scheduledAt: new Date().toISOString().slice(0, 16) });
    setModalMode("create");
  };

  const openModal = (mode: "edit" | "view", event: Event) => {
    setSelected(event);
    setForm({
      title: event.title,
      description: event.description || "",
      sport: event.sport,
      league: event.league || "",
      leagueLogo: event.leagueLogo || "",
      teamA: event.teamA || "",
      teamALogo: event.teamALogo || "",
      teamB: event.teamB || "",
      teamBLogo: event.teamBLogo || "",
      scoreA: typeof event.scoreA === "number" ? String(event.scoreA) : "",
      scoreB: typeof event.scoreB === "number" ? String(event.scoreB) : "",
      matchTime: event.matchTime || "",
      viewerCount: typeof event.viewerCount === "number" ? String(event.viewerCount) : "",
      scheduledAt: event.scheduledAt ? event.scheduledAt.slice(0, 16) : new Date().toISOString().slice(0, 16),
      status: event.status,
      thumbnail: event.thumbnail || "",
    });
    setModalMode(mode);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o titulo do evento.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      thumbnail: form.thumbnail || null,
      sport: form.sport as SportCategory,
      league: form.league || null,
      leagueLogo: form.leagueLogo || null,
      teamA: form.teamA || null,
      teamALogo: form.teamALogo || null,
      teamB: form.teamB || null,
      teamBLogo: form.teamBLogo || null,
      scoreA: form.scoreA === "" ? null : Number(form.scoreA),
      scoreB: form.scoreB === "" ? null : Number(form.scoreB),
      matchTime: form.matchTime || null,
      viewerCount: form.viewerCount === "" ? 0 : Number(form.viewerCount),
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : new Date().toISOString(),
      status: form.status as Event["status"],
    };

    try {
      if (modalMode === "edit" && selected) {
        const updated = await apiRequest<Event>(`/events/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setEvents((current) => current.map((event) => event.id === selected.id ? updated : event));
        toast.success("Evento atualizado!");
      } else {
        const created = await apiRequest<Event>("/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setEvents((current) => [created, ...current]);
        toast.success("Evento criado!");
      }
      setModalMode(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel guardar o evento.");
    }
  };

  const importWorldCupEvents = async () => {
    setImporting(true);
    try {
      const result = await apiRequest<{ importedCount: number; items: Event[] }>("/integrations/football-data/world-cup/events?season=2026", {
        method: "POST",
      });
      const refreshed = await apiRequest<Event[]>("/events");
      setEvents(refreshed);
      toast.success(`${result.importedCount} jogos da fase de grupos importados!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel importar jogos da Copa.");
    } finally {
      setImporting(false);
    }
  };

  const syncLiveFootballEvents = async () => {
    setSyncingLive(true);
    try {
      const result = await apiRequest<{ syncedCount: number; items: Event[] }>("/integrations/api-football/live-events", {
        method: "POST",
      });
      const refreshed = await apiRequest<Event[]>("/events");
      setEvents(refreshed);
      toast.success(`${result.syncedCount} jogos sincronizados da API-Football!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel sincronizar jogos ao vivo.");
    } finally {
      setSyncingLive(false);
    }
  };

  const importSportsDbCalendar = async () => {
    setImportingCalendar(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await apiRequest<{ importedCount: number; items: Event[] }>(
        `/integrations/thesportsdb/import-events?date=${today}&s=Soccer`,
        { method: "POST" },
      );
      const refreshed = await apiRequest<Event[]>("/events");
      setEvents(refreshed);
      toast.success(`${result.importedCount} eventos importados do calendario TheSportsDB!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel importar o calendario.");
    } finally {
      setImportingCalendar(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Eventos</h2>
          <p className="text-xs text-gray-400">{loading ? "A carregar eventos reais..." : `${events.length} eventos cadastrados`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={importWorldCupEvents}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {importing ? "Importando..." : "Importar Copa"}
          </button>
          <button
            onClick={importSportsDbCalendar}
            disabled={importingCalendar}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Calendar className="h-4 w-4" />
            {importingCalendar ? "Importando..." : "Importar Calendario"}
          </button>
          <button
            onClick={syncLiveFootballEvents}
            disabled={syncingLive}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncingLive ? "animate-spin" : ""}`} />
            {syncingLive ? "Sincronizando..." : "Sincronizar ao vivo"}
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-white">{events.length}</p><p className="text-xs text-gray-400">Total</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-blue-400">{events.filter((event) => event.status === "upcoming").length}</p><p className="text-xs text-gray-400">Agendados</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-red-400">{events.filter((event) => event.status === "live").length}</p><p className="text-xs text-gray-400">Ao vivo</p></div>
      </div>

      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar eventos..." className="input-dark w-full py-2.5 pl-9 pr-4 text-sm" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["Evento", "Liga", "Desporto", "Data", "Status", "Acoes"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="table-row-hover border-b border-[#2A2A2A] last:border-0">
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <AdminTeamMark logo={event.teamALogo} name={event.teamA} code={event.teamACode} size={32} />
                      <span>{event.teamA && event.teamB ? `${event.teamA} vs ${event.teamB}` : event.title}</span>
                      <AdminTeamMark logo={event.teamBLogo} name={event.teamB} code={event.teamBCode} size={32} />
                    </p>
                    <p className="text-xs text-gray-400">{event.title}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">
                    <span className="inline-flex items-center gap-2">
                      {isLeagueLogoDisplayable(event.leagueLogo) && (
                        <img src={event.leagueLogo!} alt="" className="h-5 w-5 rounded object-cover" />
                      )}
                      {event.league || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">{sportOptions.find((sport) => sport.value === event.sport)?.label}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-300">{formatDateTime(event.scheduledAt)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${event.status === "live" ? "bg-red-500/20 text-red-400" : event.status === "finished" ? "bg-gray-500/20 text-gray-400" : event.status === "cancelled" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>{statusOptions.find((status) => status.value === event.status)?.label}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-1.5"><AdminActionButton title="Visualizar" onClick={() => openModal("view", event)} tone="view"><Eye className="h-3.5 w-3.5" /></AdminActionButton><AdminActionButton title="Editar" onClick={() => openModal("edit", event)} tone="edit"><Edit2 className="h-3.5 w-3.5" /></AdminActionButton><AdminActionButton title="Remover" onClick={async () => { try { await apiRequest(`/events/${event.id}`, { method: "DELETE" }); setEvents((current) => current.filter((item) => item.id !== event.id)); toast.success("Evento removido!"); } catch (error) { toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o evento."); } }} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] p-5">
              <h3 className="font-bold text-white">{modalMode === "create" ? "Novo Evento" : modalMode === "edit" ? "Editar Evento" : "Visualizar Evento"}</h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Titulo *</label><input disabled={modalMode === "view"} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
              <AdminImageField
                label="Imagem do evento"
                disabled={modalMode === "view"}
                value={form.thumbnail}
                onChange={(value) => setForm({ ...form, thumbnail: value })}
                sizeHint={IMAGE_SIZE_PRESETS.eventThumbnail}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Equipa A</label><input disabled={modalMode === "view"} value={form.teamA} onChange={(event) => setForm({ ...form, teamA: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Equipa B</label><input disabled={modalMode === "view"} value={form.teamB} onChange={(event) => setForm({ ...form, teamB: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
              </div>
              {modalMode !== "view" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminTeamSearchField
                    label="Pesquisar Equipa A (TheSportsDB)"
                    onApply={(team) =>
                      setForm((current) => ({
                        ...current,
                        teamA: team.name,
                        teamALogo: team.badge || current.teamALogo,
                        league: current.league || team.league,
                        leagueLogo: current.leagueLogo || team.badge || current.leagueLogo,
                      }))
                    }
                  />
                  <AdminTeamSearchField
                    label="Pesquisar Equipa B (TheSportsDB)"
                    onApply={(team) =>
                      setForm((current) => ({
                        ...current,
                        teamB: team.name,
                        teamBLogo: team.badge || current.teamBLogo,
                      }))
                    }
                  />
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminImageField
                  label="Escudo da Equipa A"
                  disabled={modalMode === "view"}
                  value={form.teamALogo}
                  onChange={(value) => setForm({ ...form, teamALogo: value })}
                  aspectClassName="aspect-square"
                  sizeHint={IMAGE_SIZE_PRESETS.teamLogo}
                />
                <AdminImageField
                  label="Escudo da Equipa B"
                  disabled={modalMode === "view"}
                  value={form.teamBLogo}
                  onChange={(value) => setForm({ ...form, teamBLogo: value })}
                  aspectClassName="aspect-square"
                  sizeHint={IMAGE_SIZE_PRESETS.teamLogo}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Placar A</label><input disabled={modalMode === "view"} type="number" value={form.scoreA} onChange={(event) => setForm({ ...form, scoreA: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="0" /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Placar B</label><input disabled={modalMode === "view"} type="number" value={form.scoreB} onChange={(event) => setForm({ ...form, scoreB: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="0" /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Tempo</label><input disabled={modalMode === "view"} value={form.matchTime} onChange={(event) => setForm({ ...form, matchTime: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="75' / Q4" /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Espectadores</label><input disabled={modalMode === "view"} type="number" value={form.viewerCount} onChange={(event) => setForm({ ...form, viewerCount: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="125400" /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Liga</label><input disabled={modalMode === "view"} value={form.league} onChange={(event) => setForm({ ...form, league: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Data e hora</label><input disabled={modalMode === "view"} type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
              </div>
              <AdminImageField
                label="Logo da liga"
                disabled={modalMode === "view"}
                value={form.leagueLogo}
                onChange={(value) => setForm({ ...form, leagueLogo: value })}
                aspectClassName="aspect-square"
                className="max-w-[220px]"
                sizeHint={IMAGE_SIZE_PRESETS.leagueLogo}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Desporto</label><AdminSelect disabled={modalMode === "view"} value={form.sport} onChange={(value) => setForm({ ...form, sport: value })} options={sportOptions} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Status</label><AdminSelect disabled={modalMode === "view"} value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={statusOptions} /></div>
              </div>
              <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Descricao</label><textarea disabled={modalMode === "view"} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="input-dark w-full resize-none px-3 py-2.5 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#2A2A2A] p-5">
              <button onClick={() => setModalMode(null)} className="rounded-lg bg-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-[#3A3A3A]">Fechar</button>
              {modalMode !== "view" && <button onClick={saveEvent} className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">Salvar</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
