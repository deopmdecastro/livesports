"use client";

import { useEffect, useState } from "react";
import { Calendar, Edit2, Eye, ImageIcon, Plus, RefreshCw, Search, Trash2, Upload, X, CheckCircle, XCircle, Archive, Trophy } from "lucide-react";
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
import ApiKeyRequiredModal from "@/components/admin/ApiKeyRequiredModal";
import SyncCompetitionsModal, { EVENTS_PROVIDERS } from "@/components/admin/SyncCompetitionsModal";

import { useRef } from "react";

// ─── Inline Logo Upload Box (used in Equipas tab) ──────────────────────────
function LogoUploadBox({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file || disabled) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") onChange(reader.result); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      {value ? (
        <div className="group relative flex items-center justify-center h-24 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <img src={value} alt="" className="h-full w-full object-contain p-2" />
          {!disabled && (
            <button
              onClick={() => onChange("")}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-red-500/80 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!disabled) handleFile(e.dataTransfer.files?.[0]); }}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center h-24 rounded-xl border border-dashed cursor-pointer transition-all ${
            dragOver ? "border-[#E50914]/50 bg-[#E50914]/[0.04]" : disabled ? "border-white/[0.04] bg-white/[0.01] cursor-default" : "border-white/[0.08] bg-white/[0.01] hover:border-[#E50914]/30"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${dragOver ? "border-[#E50914]/40 text-[#E50914]" : "border-white/[0.06] text-gray-600"}`}>
              {dragOver ? <Upload className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            </div>
            <span className="text-[10px] text-gray-600 max-w-[100px] text-center leading-tight">
              {dragOver ? "Largar imagem" : disabled ? "Sem imagem" : "PNG, JPG ou WEBP (máx. 2MB)"}
            </span>
          </div>
          {!disabled && <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />}
        </div>
      )}
    </div>
  );
}

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
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [eventModalTab, setEventModalTab] = useState<"Geral" | "Equipas" | "Detalhes">("Geral");
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

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

  const refreshEvents = async () => {
    const refreshed = await apiRequest<Event[]>("/events");
    setEvents(refreshed);
  };

  const syncEventProvider = async (providerId: string) => {
    if (providerId === "api_football") {
      const result = await apiRequest<{ syncedCount: number; items: Event[] }>(
        "/integrations/api-football/live-events",
        { method: "POST" },
      );
      await refreshEvents();
      return { added: result.syncedCount, updated: 0, skipped: 0, errors: 0 };
    }

    if (providerId === "football_data") {
      const result = await apiRequest<{ importedCount: number; items: Event[] }>(
        "/integrations/football-data/world-cup/events?season=2026",
        { method: "POST" },
      );
      await refreshEvents();
      return { added: result.importedCount, updated: 0, skipped: 0, errors: 0 };
    }

    if (providerId === "thesportsdb") {
      const today = new Date().toISOString().slice(0, 10);
      const result = await apiRequest<{ importedCount: number; items: Event[] }>(
        `/integrations/thesportsdb/import-events?date=${today}&s=Soccer`,
        { method: "POST" },
      );
      await refreshEvents();
      return { added: result.importedCount, updated: 0, skipped: 0, errors: 0 };
    }

    throw new Error("Provedor não suportado.");
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
            onClick={() => setShowSyncModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A2A2A]"
          >
            <RefreshCw className="h-4 w-4" />
            Sincronizar
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-white">{events.length}</p><p className="text-xs text-gray-400">Total</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-red-400">{events.filter((event) => event.status === "upcoming").length}</p><p className="text-xs text-gray-400">Agendados</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-red-400">{events.filter((event) => event.status === "live").length}</p><p className="text-xs text-gray-400">Ao vivo</p></div>
      </div>

      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar eventos..." className="input-dark w-full py-2.5 pl-9 pr-4 text-sm" />
        </div>
      </div>

      {/* ── Active Events Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
          <h3 className="text-sm font-bold text-white">Eventos Ativos <span className="ml-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-400">{filteredNormalEvents.length}</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["Evento", "Liga", "Desporto", "Data", "Status", "Ações"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">A carregar...</td></tr>
              ) : filteredNormalEvents.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum evento ativo</td></tr>
              ) : filteredNormalEvents.map((event) => (
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
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${event.status === "live" ? "bg-red-500/20 text-red-400" : event.status === "finished" ? "bg-gray-500/20 text-gray-400" : event.status === "cancelled" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{statusOptions.find((status) => status.value === event.status)?.label}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-1.5">
                    <AdminActionButton title="Visualizar" onClick={() => openModal("view", event)} tone="view"><Eye className="h-3.5 w-3.5" /></AdminActionButton>
                    <AdminActionButton title="Editar" onClick={() => openModal("edit", event)} tone="edit"><Edit2 className="h-3.5 w-3.5" /></AdminActionButton>
                    <AdminActionButton title="Arquivar" onClick={() => handleArchiveToggle(event, true)} tone="view"><Archive className="h-3.5 w-3.5 text-amber-400" /></AdminActionButton>
                    <AdminActionButton title="Remover" onClick={async () => { if (!confirm("Remover este evento?")) return; try { await apiRequest(`/events/${event.id}`, { method: "DELETE" }); setEvents((current) => current.filter((item) => item.id !== event.id)); toast.success("Evento removido!"); } catch (error) { toast.error(error instanceof Error ? error.message : "Nao foi possivel remover."); } }} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Archived Events Table ── */}
      {archivedEvents.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-[#1A1A1A]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400">Eventos Arquivados <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">{filteredArchivedEvents.length}</span></h3>
            </div>
            <p className="text-xs text-gray-500">Eventos arquivados são ocultados do site mas mantidos na base de dados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  {["Evento", "Liga", "Desporto", "Data", "Status", "Ações"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredArchivedEvents.map((event) => (
                  <tr key={event.id} className="border-b border-[#2A2A2A] last:border-0 opacity-60 hover:opacity-90 transition-opacity">
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-white">
                        <AdminTeamMark logo={event.teamALogo} name={event.teamA} code={event.teamACode} size={32} />
                        <span>{event.teamA && event.teamB ? `${event.teamA} vs ${event.teamB}` : event.title}</span>
                        <AdminTeamMark logo={event.teamBLogo} name={event.teamB} code={event.teamBCode} size={32} />
                      </p>
                      <p className="text-xs text-gray-400">{event.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">{event.league || "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-300">{sportOptions.find((s) => s.value === event.sport)?.label}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-300">{formatDateTime(event.scheduledAt)}</td>
                    <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-gray-500/20 text-gray-400">{statusOptions.find((s) => s.value === event.status)?.label}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1.5">
                      <AdminActionButton title="Desarquivar" onClick={() => handleArchiveToggle(event, false)} tone="view">
                        <span className="text-[10px] font-bold text-green-400 px-1">↩ Restaurar</span>
                      </AdminActionButton>
                      <AdminActionButton title="Remover permanentemente" onClick={async () => { if (!confirm("Remover permanentemente? Esta ação é irreversível.")) return; try { await apiRequest(`/events/${event.id}`, { method: "DELETE" }); setEvents((prev) => prev.filter((e) => e.id !== event.id)); toast.success("Evento removido!"); } catch { toast.error("Erro ao remover"); } }} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1E1E2A] px-5 py-4 bg-gradient-to-r from-[#0C0C14] to-[#111118]">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${modalMode === "create" ? "bg-red-500/10 border-red-500/20" : modalMode === "edit" ? "bg-amber-500/10 border-amber-500/20" : "bg-blue-500/10 border-blue-500/20"}`}>
                  {modalMode === "create" ? <Plus className="h-5 w-5 text-red-400" /> : modalMode === "edit" ? <Edit2 className="h-5 w-5 text-amber-400" /> : <Eye className="h-5 w-5 text-blue-400" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {modalMode === "create" ? "Novo Evento" : modalMode === "edit" ? "Editar Evento" : "Visualizar Evento"}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {modalMode === "view" ? `ID: ${selected?.id?.slice(0, 8)}...` : "Preencha os dados do evento desportivo"}
                  </p>
                </div>
              </div>
              <button onClick={() => setModalMode(null)} className="rounded-xl p-2.5 text-gray-500 hover:bg-white/5 hover:text-white transition-all"><X className="h-4 w-4" /></button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-[#1E1E2A] px-5 gap-1">
              {([
                { key: "Geral", icon: Calendar },
                { key: "Equipas", icon: Trophy },
                { key: "Detalhes", icon: Edit2 },
              ] as const).map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setEventModalTab(key)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all ${
                    eventModalTab === key ? "text-red-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${eventModalTab === key ? "text-red-400" : "text-gray-600 group-hover:text-gray-400"}`} />
                  {key}
                  {eventModalTab === key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-[#E50914]" />}
                </button>
              ))}
            </div>
            <div className="p-5 space-y-5">
              {/* ── TAB: GERAL ── */}
              {eventModalTab === "Geral" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-400">Título do evento <span className="text-[#E50914]">*</span></label>
                    <input disabled={modalMode === "view"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Ex: Manchester United vs Liverpool" />
                  </div>

                  {/* Image upload — modern dropzone */}
                  {modalMode !== "view" ? (
                    <AdminImageField label="Imagem do evento" disabled={false} value={form.thumbnail} onChange={(v) => setForm({ ...form, thumbnail: v })} sizeHint={IMAGE_SIZE_PRESETS.eventThumbnail} />
                  ) : (
                    <AdminImageField label="Imagem do evento" disabled value={form.thumbnail} onChange={() => {}} />
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-400">Liga / Competição</label>
                      <input disabled={modalMode === "view"} value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Premier League" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-400">Data e hora <span className="text-[#E50914]">*</span></label>
                      <input disabled={modalMode === "view"} type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-400">Desporto</label>
                      <AdminSelect disabled={modalMode === "view"} value={form.sport} onChange={(v) => setForm({ ...form, sport: v })} options={sportOptions} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-400">Status</label>
                      <AdminSelect disabled={modalMode === "view"} value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={statusOptions} />
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB: EQUIPAS ── */}
              {eventModalTab === "Equipas" && (
                <>
                  {/* Team search side-by-side */}
                  {modalMode !== "view" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AdminTeamSearchField label="Equipa A (TheSportsDB)" onApply={(team) => setForm((c) => ({ ...c, teamA: team.name, teamALogo: team.badge || c.teamALogo, league: c.league || team.league, leagueLogo: c.leagueLogo || team.badge || c.leagueLogo }))} />
                      <AdminTeamSearchField label="Equipa B (TheSportsDB)" onApply={(team) => setForm((c) => ({ ...c, teamB: team.name, teamBLogo: team.badge || c.teamBLogo }))} />
                    </div>
                  )}

                  {/* VS + score + match details */}
                  <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0C0C14] to-[#111118] p-5">
                    <p className="mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Confronto</p>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                      {/* Team A */}
                      <div className="text-center space-y-2">
                        {form.teamALogo ? (
                          <img src={form.teamALogo} className="w-10 h-10 mx-auto object-contain rounded-lg p-0.5 bg-white/5" alt="" />
                        ) : (
                          <div className="w-10 h-10 mx-auto rounded-lg bg-white/5 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <input disabled={modalMode === "view"} value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })} className="input-dark w-full px-3 py-2 text-sm text-center font-semibold" placeholder="Equipa A" />
                      </div>
                      {/* Score */}
                      <div className="flex items-center gap-2 shrink-0">
                        <input disabled={modalMode === "view"} type="number" min={0} value={form.scoreA} onChange={(e) => setForm({ ...form, scoreA: e.target.value })} className="input-dark w-11 h-10 text-center text-lg font-black rounded-lg bg-[#1A1A22] border-[#2A2A35]" placeholder="–" />
                        <span className="text-[10px] font-bold text-gray-600 uppercase px-1">vs</span>
                        <input disabled={modalMode === "view"} type="number" min={0} value={form.scoreB} onChange={(e) => setForm({ ...form, scoreB: e.target.value })} className="input-dark w-11 h-10 text-center text-lg font-black rounded-lg bg-[#1A1A22] border-[#2A2A35]" placeholder="–" />
                      </div>
                      {/* Team B */}
                      <div className="text-center space-y-2">
                        {form.teamBLogo ? (
                          <img src={form.teamBLogo} className="w-10 h-10 mx-auto object-contain rounded-lg p-0.5 bg-white/5" alt="" />
                        ) : (
                          <div className="w-10 h-10 mx-auto rounded-lg bg-white/5 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <input disabled={modalMode === "view"} value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })} className="input-dark w-full px-3 py-2 text-sm text-center font-semibold" placeholder="Equipa B" />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 mt-4 pt-4 border-t border-white/[0.04]">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Tempo de jogo</label>
                        <input disabled={modalMode === "view"} value={form.matchTime} onChange={(e) => setForm({ ...form, matchTime: e.target.value })} className="input-dark w-full px-3 py-2 text-xs" placeholder="Ex: 75'" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Espectadores</label>
                        <input disabled={modalMode === "view"} type="number" value={form.viewerCount} onChange={(e) => setForm({ ...form, viewerCount: e.target.value })} className="input-dark w-full px-3 py-2 text-xs" placeholder="Número de espectadores" />
                      </div>
                    </div>
                  </div>

                  {/* Logos — 3 clean columns with dropzone + URL */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Logos e Escudos</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Escudo A */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Escudo A</p>
                      <LogoUploadBox value={form.teamALogo} onChange={(v) => setForm({ ...form, teamALogo: v })} disabled={modalMode === "view"} />
                      {modalMode !== "view" && (
                        <input value={form.teamALogo.startsWith("data:") ? "" : form.teamALogo} onChange={(e) => setForm({ ...form, teamALogo: e.target.value })} className="input-dark w-full px-2.5 py-1.5 text-[11px]" placeholder="URL do escudo A" />
                      )}
                    </div>
                    {/* Escudo B */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Escudo B</p>
                      <LogoUploadBox value={form.teamBLogo} onChange={(v) => setForm({ ...form, teamBLogo: v })} disabled={modalMode === "view"} />
                      {modalMode !== "view" && (
                        <input value={form.teamBLogo.startsWith("data:") ? "" : form.teamBLogo} onChange={(e) => setForm({ ...form, teamBLogo: e.target.value })} className="input-dark w-full px-2.5 py-1.5 text-[11px]" placeholder="URL do escudo B" />
                      )}
                    </div>
                    {/* Logo Liga */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Logo Liga</p>
                      <LogoUploadBox value={form.leagueLogo} onChange={(v) => setForm({ ...form, leagueLogo: v })} disabled={modalMode === "view"} />
                      {modalMode !== "view" && (
                        <input value={form.leagueLogo.startsWith("data:") ? "" : form.leagueLogo} onChange={(e) => setForm({ ...form, leagueLogo: e.target.value })} className="input-dark w-full px-2.5 py-1.5 text-[11px]" placeholder="URL do logo da liga" />
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB: DETALHES ── */}
              {eventModalTab === "Detalhes" && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400">Descrição do evento</label>
                  <textarea
                    disabled={modalMode === "view"}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={5}
                    maxLength={1000}
                    className="input-dark w-full resize-none px-3 py-2.5 text-sm"
                    placeholder="Informações sobre o evento, contexto, fase da competição, observações..."
                  />
                  <p className="text-right text-[10px] text-gray-600">{form.description.length} / 1000</p>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[#1E1E2A] px-5 py-4">
              <div className="flex gap-1.5">
                {(["Geral", "Equipas", "Detalhes"] as const).map((tab) => (
                  <button key={tab} onClick={() => setEventModalTab(tab)} className={`h-1.5 rounded-full transition-all ${eventModalTab === tab ? "w-6 bg-red-500" : "w-1.5 bg-white/15"}`} />
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModalMode(null)} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:border-white/15 transition-all">
                  {modalMode === "view" ? "Fechar" : "Cancelar"}
                </button>
                {modalMode !== "view" && (
                  <button onClick={saveEvent} className="rounded-xl bg-[#E50914] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.25)] hover:bg-[#C50010] transition-all">
                    {modalMode === "edit" ? "Guardar Evento" : "Criar Evento"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <SyncCompetitionsModal
          title="Sincronizar Eventos"
          providerDefinitions={EVENTS_PROVIDERS}
          summaryItems={["Jogos ao vivo", "Copa do Mundo", "Calendário diário"]}
          summaryLabel="Eventos"
          onClose={() => setShowSyncModal(false)}
          onNoApiKey={() => {
            setShowSyncModal(false);
            setApiKeyModalOpen(true);
          }}
          onSyncProvider={syncEventProvider}
          onSyncComplete={(results) => {
            const total = results.reduce((acc, r) => acc + r.added, 0);
            toast.success(`Sincronização concluída! ${total} evento(s) processado(s).`);
          }}
        />
      )}

      {/* API Key Required Modal */}
      {apiKeyModalOpen && (
        <ApiKeyRequiredModal
          context="Sincronizar Eventos"
          suggestedProvider="api_football"
          onClose={() => setApiKeyModalOpen(false)}
          onKeySaved={() => {
            setApiKeyModalOpen(false);
            setShowSyncModal(true);
          }}
        />
      )}
    </div>
  );
}
