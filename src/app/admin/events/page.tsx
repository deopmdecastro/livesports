"use client";

import { useEffect, useState } from "react";
import { Calendar, Download, Edit2, Eye, Plus, RefreshCw, Search, Trash2, X, CheckCircle, XCircle, Archive } from "lucide-react";
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

  const normalEvents = events.filter((e) => !(e as any).archived);
  const archivedEvents = events.filter((e) => Boolean((e as any).archived));

  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [importing, setImporting] = useState(false);
  const [syncingLive, setSyncingLive] = useState(false);
  const [importingCalendar, setImportingCalendar] = useState(false);
  const [eventModalTab, setEventModalTab] = useState<"Geral" | "Equipas" | "Detalhes">("Geral");

  const filteredNormalEvents = normalEvents.filter((event) =>
    [event.title, event.league || "", event.teamA || "", event.teamB || ""].some((value) => value.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredArchivedEvents = archivedEvents.filter((event) =>
    [event.title, event.league || "", event.teamA || "", event.teamB || ""].some((value) => value.toLowerCase().includes(search.toLowerCase()))
  );

  const handleArchiveToggle = async (event: Event, archived: boolean) => {
    try {
      await apiRequest(`/events/${event.id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ archived }),
      });
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, archived } : e)));
      toast.success(archived ? "Evento arquivado!" : "Evento desarquivado!");
    } catch {
      toast.error(archived ? "Erro ao arquivar" : "Erro ao desarquivar");
    }
  };

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

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Tabela Normal (archived=false) */}
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
                {filteredNormalEvents.map((event) => (
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
                  <td className="px-4 py-3"><div className="flex gap-1.5">
                    <AdminActionButton title="Visualizar" onClick={() => openModal("view", event)} tone="view"><Eye className="h-3.5 w-3.5" /></AdminActionButton>
                    <AdminActionButton title="Editar" onClick={() => openModal("edit", event)} tone="edit"><Edit2 className="h-3.5 w-3.5" /></AdminActionButton>
                    <AdminActionButton title="Arquivar" onClick={async () => { try { await apiRequest(`/events/${event.id}/archive`, { method: "PATCH", body: JSON.stringify({ archived: true }) }); setEvents((prev) => prev.filter((e) => e.id !== event.id)); toast.success("Evento arquivado!"); } catch { toast.error("Erro ao arquivar"); } }} tone="view"><Archive className="h-3.5 w-3.5 text-gray-400" /></AdminActionButton>
                    <AdminActionButton title="Remover" onClick={async () => { if (!confirm("Remover este evento?")) return; try { await apiRequest(`/events/${event.id}`, { method: "DELETE" }); setEvents((current) => current.filter((item) => item.id !== event.id)); toast.success("Evento removido!"); } catch (error) { toast.error(error instanceof Error ? error.message : "Nao foi possivel remover."); } }} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1E1E2A] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-white">
                    {modalMode === "create" ? "Novo Evento" : modalMode === "edit" ? "Editar Evento" : "Visualizar Evento"}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {modalMode === "view" ? `ID: ${selected?.id}` : "Preencha os dados do evento desportivo"}
                  </p>
                </div>
              </div>
              <button onClick={() => setModalMode(null)} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-[#1E1E2A] px-5 pt-3">
              {(["Geral", "Equipas", "Detalhes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setEventModalTab(tab)}
                  className={`rounded-t-lg px-4 py-2.5 text-xs font-bold transition-all ${
                    eventModalTab === tab ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-5 space-y-4">
              {/* ── TAB: GERAL ── */}
              {eventModalTab === "Geral" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-300">Título <span className="text-[#E50914]">*</span></label>
                    <input disabled={modalMode === "view"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Ex: Manchester United vs Liverpool" />
                  </div>
                  <AdminImageField label="Imagem do evento" disabled={modalMode === "view"} value={form.thumbnail} onChange={(v) => setForm({ ...form, thumbnail: v })} sizeHint={IMAGE_SIZE_PRESETS.eventThumbnail} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-300">Liga / Competição</label>
                      <input disabled={modalMode === "view"} value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Premier League" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-300">Data e hora <span className="text-[#E50914]">*</span></label>
                      <input disabled={modalMode === "view"} type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-300">Desporto</label>
                      <AdminSelect disabled={modalMode === "view"} value={form.sport} onChange={(v) => setForm({ ...form, sport: v })} options={sportOptions} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-300">Status</label>
                      <AdminSelect disabled={modalMode === "view"} value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={statusOptions} />
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB: EQUIPAS ── */}
              {eventModalTab === "Equipas" && (
                <>
                  {/* VS block */}
                  <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                    <p className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Confronto</p>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Equipa A</label>
                        <input disabled={modalMode === "view"} value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="Nome da equipa A" />
                      </div>
                      <div className="text-center">
                        <span className="text-lg font-black text-gray-600">VS</span>
                        <div className="flex gap-1 mt-1 justify-center">
                          <input disabled={modalMode === "view"} type="number" min={0} value={form.scoreA} onChange={(e) => setForm({ ...form, scoreA: e.target.value })} className="input-dark w-10 px-1 py-1 text-sm text-center font-black" placeholder="0" />
                          <span className="text-gray-600 self-center">:</span>
                          <input disabled={modalMode === "view"} type="number" min={0} value={form.scoreB} onChange={(e) => setForm({ ...form, scoreB: e.target.value })} className="input-dark w-10 px-1 py-1 text-sm text-center font-black" placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Equipa B</label>
                        <input disabled={modalMode === "view"} value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="Nome da equipa B" />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 mt-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Tempo de jogo</label>
                        <input disabled={modalMode === "view"} value={form.matchTime} onChange={(e) => setForm({ ...form, matchTime: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="75' / Q4 / Set 2" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Espectadores</label>
                        <input disabled={modalMode === "view"} type="number" value={form.viewerCount} onChange={(e) => setForm({ ...form, viewerCount: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="125400" />
                      </div>
                    </div>
                  </div>
                  {/* Team search */}
                  {modalMode !== "view" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AdminTeamSearchField label="Pesquisar Equipa A (TheSportsDB)" onApply={(team) => setForm((c) => ({ ...c, teamA: team.name, teamALogo: team.badge || c.teamALogo, league: c.league || team.league, leagueLogo: c.leagueLogo || team.badge || c.leagueLogo }))} />
                      <AdminTeamSearchField label="Pesquisar Equipa B (TheSportsDB)" onApply={(team) => setForm((c) => ({ ...c, teamB: team.name, teamBLogo: team.badge || c.teamBLogo }))} />
                    </div>
                  )}
                  {/* Logos */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AdminImageField label="Escudo Equipa A" disabled={modalMode === "view"} value={form.teamALogo} onChange={(v) => setForm({ ...form, teamALogo: v })} aspectClassName="aspect-square" sizeHint={IMAGE_SIZE_PRESETS.teamLogo} />
                    <AdminImageField label="Escudo Equipa B" disabled={modalMode === "view"} value={form.teamBLogo} onChange={(v) => setForm({ ...form, teamBLogo: v })} aspectClassName="aspect-square" sizeHint={IMAGE_SIZE_PRESETS.teamLogo} />
                  </div>
                  <AdminImageField label="Logo da Liga" disabled={modalMode === "view"} value={form.leagueLogo} onChange={(v) => setForm({ ...form, leagueLogo: v })} aspectClassName="aspect-square" className="max-w-[180px]" sizeHint={IMAGE_SIZE_PRESETS.leagueLogo} />
                </>
              )}

              {/* ── TAB: DETALHES ── */}
              {eventModalTab === "Detalhes" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Descrição</label>
                  <textarea disabled={modalMode === "view"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className="input-dark w-full resize-none px-3 py-2.5 text-sm" placeholder="Informações sobre o evento, contexto, fase da competição..." />
                </div>
              )}
              <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Descricao</label><textarea disabled={modalMode === "view"} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="input-dark w-full resize-none px-3 py-2.5 text-sm" /></div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#1E1E2A] p-5">
              <div className="flex gap-1">
                {(["Geral", "Equipas", "Detalhes"] as const).map((tab) => (
                  <button key={tab} onClick={() => setEventModalTab(tab)} className={`h-1.5 rounded-full transition-all ${eventModalTab === tab ? "w-6 bg-blue-500" : "w-1.5 bg-white/20"}`} />
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModalMode(null)} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors">{modalMode === "view" ? "Fechar" : "Cancelar"}</button>
                {modalMode !== "view" && (
                  <button onClick={saveEvent} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:from-blue-500 hover:to-blue-600 transition-all">
                    {modalMode === "edit" ? "Guardar Evento" : "Criar Evento"}
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
