"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Radio,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  CalendarClock,
  Users,
  Trophy,
  Signal,
  Server,
  X,
  RefreshCw,
  Archive,
} from "lucide-react";
import { cn, formatDateTime, formatNumber, getSportLabel } from "@/utils";
import type { Live, LiveStatus, LiveStreamServer, SportCategory, Event } from "@/types";
import toast from "react-hot-toast";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminActionButton from "@/components/admin/AdminActionButton";
import AdminLivePreviewModal from "@/components/admin/AdminLivePreviewModal";
import AdminTeamMark, { isLeagueLogoDisplayable } from "@/components/admin/AdminTeamMark";
import { apiRequest, type ApiListResponse } from "@/lib/api";
import ApiKeyRequiredModal from "@/components/admin/ApiKeyRequiredModal";
import SyncCompetitionsModal, { LIVES_PROVIDERS } from "@/components/admin/SyncCompetitionsModal";

const statusConfig: Record<
  LiveStatus,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
  }
> = {
  live: {
    label: "Ao vivo",
    icon: <span className="h-1.5 w-1.5 rounded-full bg-red-300 live-badge" />,
    className: "border-red-500/30 bg-red-500/15 text-red-200",
  },
  scheduled: {
    label: "Agendada",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "border-red-500/30 bg-red-500/15 text-red-200",
  },
  ended: {
    label: "Encerrada",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    className: "border-zinc-500/30 bg-zinc-500/15 text-zinc-300",
  },
  cancelled: {
    label: "Cancelada",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "border-red-800/40 bg-red-950/40 text-red-300",
  },
};

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
  { value: "all", label: "Todos os status" },
  { value: "live", label: "Ao vivo" },
  { value: "scheduled", label: "Agendadas" },
  { value: "ended", label: "Encerradas" },
  { value: "cancelled", label: "Canceladas" },
];

const sportFilterOptions = [
  { value: "all", label: "Todos os desportos" },
  ...sportOptions,
];

const DEFAULT_STREAM_URL = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function createStreamServer(index: number, url = ""): LiveStreamServer {
  return {
    id: `${Date.now()}-${index}`,
    name: `Servidor ${index + 1}`,
    quality: "Auto HD",
    latency: "Baixa",
    url,
  };
}

function StatusBadge({ status }: { status: LiveStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        config.className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function LiveScore({ live }: { live: Live }) {
  if (typeof live.scoreA !== "number" || typeof live.scoreB !== "number") {
    return null;
  }

  return (
    <span className="score-display rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs font-bold text-white">
      {live.scoreA} - {live.scoreB}
    </span>
  );
}

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

export default function LivesPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingLive, setEditingLive] = useState<Live | null>(null);
  const [modalTab, setModalTab] = useState<"Geral" | "Streaming" | "Detalhes">("Geral");
  const [viewingLive, setViewingLive] = useState<Live | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  // Event select/search state (Nova Live)
  const [eventQuery, setEventQuery] = useState("");
  const [eventSearchLoading, setEventSearchLoading] = useState(false);
  const [eventOptions, setEventOptions] = useState<Event[]>([]);

  // Load todos os eventos quando abrir/criar live (sem pesquisar)
  useEffect(() => {
    if (!showModal || editingLive) return;

    let cancelled = false;

    // Mantém a UX: mostra todos no select imediatamente
    apiRequest<Event[]>(`/events?limit=200`)
      .then((events) => {
        if (cancelled) return;
        setEventOptions(events || []);
      })
      .catch(() => {
        if (cancelled) return;
        setEventOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [showModal, editingLive]);


  const [form, setForm] = useState({
    eventId: "",
    title: "",
    sport: "football" as SportCategory,
    league: "",
    leagueLogo: "",
    teamA: "",
    teamALogo: "",
    teamB: "",
    teamBLogo: "",
    thumbnail: "",
    banner: "",
    scoreA: undefined as number | undefined,
    scoreB: undefined as number | undefined,
    matchTime: "",
    hlsUrl: "",
    m3u8Url: "",
    youtubeUrl: "",
    youtubeEmbed: "",
    streamServers: [createStreamServer(0, DEFAULT_STREAM_URL)],
    scheduledAt: "",
    description: "",
    featured: false,
  });

  useEffect(() => {
    apiRequest<ApiListResponse<Live>>("/lives?limit=100")
      .then((data) => setLives(data.items))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar as lives."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showModal) return;

    const q = eventQuery.trim();

    // Sem pesquisa: mantém a lista completa carregada anteriormente.
    if (!q) {
      setEventSearchLoading(false);
      return;
    }

    const t = setTimeout(() => {
      setEventSearchLoading(true);
      apiRequest<Event[]>(`/events/search?q=${encodeURIComponent(q)}&limit=20&sport=${encodeURIComponent(String(form.sport))}`)
        .then((events) => setEventOptions(events))
        .catch(() => setEventOptions([]))
        .finally(() => setEventSearchLoading(false));
    }, 250);

    return () => clearTimeout(t);
  }, [eventQuery, showModal, form.sport]);


  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lives.filter((live) => {
      const matchSearch =
        !query ||
        live.title.toLowerCase().includes(query) ||
        live.teamA?.toLowerCase().includes(query) ||
        live.teamB?.toLowerCase().includes(query) ||
        live.league?.toLowerCase().includes(query);
      const matchStatus = statusFilter === "all" || live.status === statusFilter;
      const matchSport = sportFilter === "all" || live.sport === sportFilter;

      return matchSearch && matchStatus && matchSport;
    });
  }, [lives, search, sportFilter, statusFilter]);

  const liveNowCount = lives.filter((live) => live.status === "live").length;
  const scheduledCount = lives.filter((live) => live.status === "scheduled").length;
  const endedCount = lives.filter((live) => live.status === "ended").length;
  const totalViewers = lives.reduce((sum, live) => sum + live.viewerCount, 0);
  const featuredCount = lives.filter((live) => live.featured).length;
  const nextLive = lives
    .filter((live) => live.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/lives/${id}`, { method: "DELETE" });
      setLives((prev) => prev.filter((live) => live.id !== id));
      toast.success("Live removida com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover a live.");
    }
  };

  const handleArchiveToggle = async (live: Live, archived: boolean) => {
    try {
      await apiRequest(`/lives/${live.id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ archived }),
      });
      setLives((prev) => prev.map((l) => (l.id === live.id ? { ...l, archived } as Live : l)));
      toast.success(archived ? "Live arquivada!" : "Live restaurada!");
    } catch {
      toast.error(archived ? "Erro ao arquivar" : "Erro ao restaurar");
    }
  };

  const handleEdit = (live: Live) => {
    setEditingLive(live);
    setEventQuery("");
    setEventOptions([]);

    setForm({
      eventId: "", // snapshot não persistido no DB; edição mantém campos copiados
      title: live.title,
      sport: live.sport,
      league: live.league || "",
      leagueLogo: isImageValue(live.leagueLogo) ? live.leagueLogo || "" : "",
      teamA: live.teamA || "",
      teamALogo: isImageValue(live.teamALogo) ? live.teamALogo || "" : "",
      teamB: live.teamB || "",
      teamBLogo: isImageValue(live.teamBLogo) ? live.teamBLogo || "" : "",
      thumbnail: live.thumbnail || "",
      banner: live.banner || "",
      scoreA: live.scoreA,
      scoreB: live.scoreB,
      matchTime: live.matchTime || "",
      hlsUrl: live.hlsUrl || "",
      m3u8Url: live.m3u8Url || "",
      youtubeUrl: live.youtubeUrl || "",
      youtubeEmbed: live.youtubeEmbed || "",
      streamServers:
        live.streamServers && live.streamServers.length > 0
          ? live.streamServers
          : [
              createStreamServer(0, live.hlsUrl || live.m3u8Url || live.streamUrl || DEFAULT_STREAM_URL),
            ],
      scheduledAt: live.scheduledAt ? live.scheduledAt.slice(0, 16) : new Date().toISOString().slice(0, 16),
      description: live.description || "",
      featured: live.featured,
    });

    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingLive(null);
    setEventQuery("");
    setEventOptions([]);

    setForm({
      eventId: "",
      title: "",
      sport: "football",
      league: "",
      leagueLogo: "",
      teamA: "",
      teamALogo: "",
      teamB: "",
      teamBLogo: "",
      thumbnail: "",
      banner: "",
      scoreA: undefined,
      scoreB: undefined,
      matchTime: "",
      hlsUrl: "",
      m3u8Url: "",
      youtubeUrl: "",
      youtubeEmbed: "",
      streamServers: [createStreamServer(0, DEFAULT_STREAM_URL)],
      scheduledAt: new Date().toISOString().slice(0, 16),
      description: "",
      featured: false,
    });

    setShowModal(true);
  };

  const handlePickEvent = (eventId: string) => {
    const ev = eventOptions.find((e) => e.id === eventId);
    if (!ev) return;

    setForm((prev) => ({
      ...prev,
      eventId,
      title: ev.title,
      sport: ev.sport,
      league: ev.league || "",
      leagueLogo: isImageValue(ev.leagueLogo) ? ev.leagueLogo || "" : "",
      teamA: ev.teamA || "",
      teamALogo: isImageValue(ev.teamALogo) ? ev.teamALogo || "" : "",
      teamB: ev.teamB || "",
      teamBLogo: isImageValue(ev.teamBLogo) ? ev.teamBLogo || "" : "",
      thumbnail: ev.thumbnail || prev.thumbnail,
      banner: ev.thumbnail || prev.banner,
      scoreA: typeof ev.scoreA === "number" ? ev.scoreA : undefined,
      scoreB: typeof ev.scoreB === "number" ? ev.scoreB : undefined,
      matchTime: ev.matchTime || "",
      description: ev.description || prev.description,
    }));
  };

  const handleSave = async () => {
    // Allow creating lives without event - just need title
    if (!editingLive && !form.eventId && !form.title.trim()) {
      toast.error("Informe o titulo da live ou selecione um evento.");
      return;
    }

    if (editingLive && !form.title.trim()) {
      toast.error("Informe o titulo da live.");
      return;
    }

    const cleanServers = form.streamServers
      .map((server, index) => ({
        ...server,
        id: server.id || `${Date.now()}-${index}`,
        name: server.name.trim() || `Servidor ${index + 1}`,
        url: server.url.trim(),
        quality: server.quality?.trim() || "Auto",
        latency: server.latency?.trim() || "Normal",
      }))
      .filter((server) => server.url);

    // Allow creating lives even without stream URL (can be added later)
    // Only validate if we're editing and there's no youtube URL either
    if (cleanServers.length === 0 && !form.hlsUrl.trim() && !form.m3u8Url.trim() && !form.youtubeUrl.trim() && !form.youtubeEmbed.trim()) {
      toast.error("Adicione pelo menos um servidor, URL de transmissao ou link do YouTube.");
      return;
    }

      const payload = {
      ...(form.eventId ? { eventId: form.eventId } : {}),
      sport: form.sport,
      // Na criação com eventId, a liga vem do snapshot do evento no backend
      league: editingLive ? form.league || null : null,
      leagueLogo: editingLive ? form.leagueLogo || null : null,
      teamA: form.teamA || null,
      teamALogo: form.teamALogo || null,
      teamB: form.teamB || null,
      teamBLogo: form.teamBLogo || null,
      title: form.title, // fallback (backend usa snapshot se eventId existir)
      scoreA: form.scoreA ?? null,
      scoreB: form.scoreB ?? null,
      matchTime: form.matchTime || null,
      thumbnail: form.thumbnail || null,
      banner: form.banner || null,
      description: form.description || null,
      hlsUrl: form.hlsUrl || null,
      m3u8Url: form.m3u8Url || null,
      youtubeUrl: form.youtubeUrl || null,
      youtubeEmbed: form.youtubeEmbed || null,
      streamServers: cleanServers,
      scheduledAt: form.scheduledAt,
      featured: form.featured,
      status: editingLive?.status || "scheduled",
    };

    try {
      if (editingLive) {
        const updated = await apiRequest<Live>(`/lives/${editingLive.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setLives((prev) => prev.map((live) => (live.id === editingLive.id ? updated : live)));
        toast.success("Live atualizada com sucesso!");
      } else {
        const created = await apiRequest<Live>("/lives", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLives((prev) => [created, ...prev]);
        toast.success("Live criada com sucesso!");
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel guardar a live.");
    }
  };

  const syncRapidApiStreams = async () => {
    const result = await apiRequest<{ syncedCount: number; items: Live[]; notice?: string }>(
      "/integrations/rapidapi/all-live-stream",
      { method: "POST" }
    );
    const refreshed = await apiRequest<ApiListResponse<Live>>("/lives?limit=100");
    setLives(refreshed.items);
    return {
      added: result.syncedCount,
      updated: 0,
      skipped: result.notice ? result.syncedCount : 0,
      errors: 0,
    };
  };

  const syncLiveProvider = async (providerId: string) => {
    if (providerId === "api_football") {
      return syncRapidApiStreams();
    }
    throw new Error("Integração ainda não disponível para este provedor.");
  };

  const handleImportStreamsClick = () => {
    setShowSyncModal(true);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-[#151515]">
        <div className="border-b border-white/10 bg-gradient-to-r from-[#201111] via-[#151515] to-[#111827] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                <Signal className="h-3.5 w-3.5" />
                Centro de transmissao
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Gestao de Lives</h2>
              <p className="mt-1 text-sm text-gray-400">
                Acompanhe lives em curso, prepare eventos agendados e mantenha os destaques prontos para a homepage.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleImportStreamsClick}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1A1A1A] px-4 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]"
              >
                <RefreshCw className="h-4 w-4" />
                Importar streams
              </button>
              <button
                onClick={handleCreate}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#E50914] px-4 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition-colors hover:bg-[#B00000]"
              >
                <Plus className="h-4 w-4" />
                Nova Live
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Transmissoes", value: lives.length, helper: `${filtered.length} visiveis nos filtros`, icon: Radio, tone: "text-red-300" },
              { label: "Ao vivo agora", value: liveNowCount, helper: `${formatNumber(totalViewers)} espectadores`, icon: Users, tone: "text-red-300" },
              { label: "Agendadas", value: scheduledCount, helper: nextLive ? `Proxima: ${formatDateTime(nextLive.scheduledAt)}` : "Sem proximas lives", icon: CalendarClock, tone: "text-red-300" },
              { label: "Destaques", value: featuredCount, helper: `${endedCount} encerradas no arquivo`, icon: Star, tone: "text-amber-300" },
            ].map(({ label, value, helper, icon: Icon, tone }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className="mt-2 text-2xl font-black text-white">{value}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                    <Icon className={cn("h-4 w-4", tone)} />
                  </div>
                </div>
                <p className="mt-3 truncate text-xs text-gray-400">{helper}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar por titulo, equipa ou liga"
                className="input-dark h-11 w-full pl-9 pr-4 text-sm"
              />
            </div>
            <AdminSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="lg:w-48"
              ariaLabel="Filtrar por status"
            />
            <AdminSelect
              value={sportFilter}
              onChange={setSportFilter}
              options={sportFilterOptions}
              className="lg:w-52"
              ariaLabel="Filtrar por desporto"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#171717]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-white">Lista de transmissao</h3>
            <p className="text-xs text-gray-500">{loading ? "A carregar dados reais..." : `${filtered.length} resultados encontrados`}</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 sm:flex">
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            {featuredCount} em destaque
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-white/[0.02]">
                {["Evento", "Liga", "Desporto", "Audiencia", "Status", "Data", "Acoes"].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((live) => (
                <tr key={live.id} className="table-row-hover border-t border-white/10">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#262626]">
                        <img
                          src={live.thumbnail || `https://picsum.photos/seed/${live.id}/160/90`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        {live.status === "live" && (
                          <span className="absolute left-1.5 top-1.5 rounded bg-[#E50914] px-1.5 py-0.5 text-[9px] font-black text-white">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="max-w-[260px] truncate text-sm font-bold text-white">{live.title}</p>
                          {live.featured && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-300 text-amber-300" />}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          {live.teamA && live.teamB && (
                            <span className="inline-flex items-center gap-1.5">
                              <AdminTeamMark logo={live.teamALogo} name={live.teamA} size={32} className="h-4 w-4 rounded-full object-cover" />
                              {live.teamA} vs {live.teamB}
                              <AdminTeamMark logo={live.teamBLogo} name={live.teamB} size={32} className="h-4 w-4 rounded-full object-cover" />
                            </span>
                          )}
                          <LiveScore live={live} />
                          {live.matchTime && <span className="text-red-300">{live.matchTime}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-gray-300">
                    <span className="inline-flex items-center gap-2">
                      {isLeagueLogoDisplayable(live.leagueLogo) && (
                        <img src={live.leagueLogo!} alt="" className="h-5 w-5 rounded object-cover" />
                      )}
                      {live.league || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-gray-300">
                      {getSportLabel(live.sport)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-bold text-white">{formatNumber(live.viewerCount)}</div>
                    <div className="text-xs text-gray-500">{formatNumber(live.totalViews)} total</div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={live.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-400">{formatDateTime(live.scheduledAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <AdminActionButton title="Ver live" onClick={() => setViewingLive(live)} tone="view">
                        <Eye className="h-4 w-4" />
                      </AdminActionButton>
                      <AdminActionButton title="Editar live" onClick={() => handleEdit(live)} tone="edit">
                        <Edit2 className="h-4 w-4" />
                      </AdminActionButton>
                      <AdminActionButton title="Arquivar live" onClick={() => handleArchiveToggle(live, true)} tone="view">
                        <Archive className="h-4 w-4 text-amber-400" />
                      </AdminActionButton>
                      <AdminActionButton title="Remover live" onClick={() => handleDelete(live.id)} tone="danger">
                        <Trash2 className="h-4 w-4" />
                      </AdminActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

      {/* ── Archived Lives ── */}
      {lives.filter((l) => (l as any).archived).length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-amber-500/20 bg-[#1A1A1A]">
          <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <Archive className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-400">Lives Arquivadas</h3>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
              {lives.filter((l) => (l as any).archived).length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  {["Live", "Liga", "Status", "Data", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lives.filter((l) => (l as any).archived).map((live) => (
                  <tr key={live.id} className="border-b border-[#2A2A2A] last:border-0 opacity-60 hover:opacity-90 transition-opacity">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white truncate max-w-xs">
                        {live.teamA && live.teamB ? `${live.teamA} vs ${live.teamB}` : live.title}
                      </p>
                      <p className="text-xs text-gray-400">{live.sport}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">{live.league || "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={live.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{formatDateTime(live.scheduledAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <AdminActionButton title="Restaurar" onClick={() => handleArchiveToggle(live, false)} tone="view">
                          <span className="text-[10px] font-bold text-green-400 px-1">↩ Restaurar</span>
                        </AdminActionButton>
                        <AdminActionButton title="Remover" onClick={() => handleDelete(live.id)} tone="danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </AdminActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Radio className="mx-auto mb-3 h-9 w-9 text-gray-600" />
              <p className="text-sm font-semibold text-gray-300">Nenhuma live encontrada</p>
              <p className="mt-1 text-xs text-gray-500">Ajuste os filtros ou crie uma nova transmissao.</p>
            </div>
          )}
        </div>
      </div>

      {viewingLive && (
        <AdminLivePreviewModal live={viewingLive} onClose={() => setViewingLive(null)} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1E1E2A] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                  <Radio className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-white">{editingLive ? "Editar Live" : "Nova Live"}</h3>
                  <p className="text-[11px] text-gray-500">{editingLive ? `ID: ${editingLive.id}` : "Configure a transmissão ao vivo"}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            {/* Tabs — underline style */}
            <div className="flex border-b border-[#1E1E2A] px-5">
              {(["Geral", "Streaming", "Detalhes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  className={`relative px-5 py-3 text-xs font-bold transition-all ${
                    modalTab === tab ? "text-red-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab}
                  {modalTab === tab && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[#E50914]" />}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-5">

              {/* ── TAB: GERAL ── */}
              {modalTab === "Geral" && (
                <>
                  {/* Event linking (only for new lives) */}
                  {!editingLive && (
                    <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-red-400" />
                          <span className="text-sm font-bold text-white">Vincular a Evento (opcional)</span>
                        </div>
                        {eventSearchLoading && <span className="text-[10px] text-red-400 animate-pulse">A pesquisar...</span>}
                      </div>
                      <p className="mb-3 text-xs text-gray-500">Selecione um evento existente para preencher automaticamente os dados.</p>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input value={eventQuery} onChange={(e) => setEventQuery(e.target.value)} placeholder="Filtrar eventos..." className="input-dark h-10 w-full pl-9 pr-4 text-sm" />
                      </div>
                      <AdminSelect
                        value={form.eventId}
                        onChange={(value) => { setForm((prev) => ({ ...prev, eventId: value })); handlePickEvent(value); }}
                        options={eventOptions.length ? eventOptions.map((ev) => ({ value: ev.id, label: ev.title })) : [{ value: "", label: "Nenhum evento selecionado" }]}
                        ariaLabel="Selecionar evento"
                      />
                      {form.eventId && (
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 flex-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                            <span className="text-xs text-emerald-300 truncate">Vinculado a: <strong>{eventOptions.find((e) => e.id === form.eventId)?.title}</strong></span>
                          </div>
                          <button onClick={() => setForm((prev) => ({ ...prev, eventId: "" }))} className="text-[10px] text-red-400 hover:text-red-300 font-semibold px-2 flex-shrink-0">Remover</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-400">
                      {!editingLive && !form.eventId ? "Título da Live" : "Título"} <span className="text-[#E50914]">*</span>
                    </label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Ex: Real Madrid vs Barcelona" />
                    {!editingLive && !form.eventId && <p className="mt-1 text-[10px] text-gray-600">Obrigatório se não vincular a um evento.</p>}
                  </div>

                  {/* Thumbnail */}
                  <AdminImageField label="Capa / Thumbnail" value={form.thumbnail} onChange={(value) => setForm({ ...form, thumbnail: value, banner: value })} aspectClassName="aspect-video" sizeHint={IMAGE_SIZE_PRESETS.liveThumbnail} />

                  {/* Sport + League */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-400">Desporto</label>
                      <AdminSelect value={form.sport} onChange={(value) => setForm({ ...form, sport: value as SportCategory })} options={sportOptions} ariaLabel="Desporto" disabled={!!form.eventId && !editingLive} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-400">Liga / Competição</label>
                      <input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Premier League" disabled={!!form.eventId && !editingLive} />
                    </div>
                  </div>

                  {/* VS block */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Confronto</p>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <input value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="Nome da equipa A" disabled={!!form.eventId && !editingLive} />
                      <div className="flex items-center gap-2 shrink-0">
                        <input type="number" min={0} value={form.scoreA ?? ""} onChange={(e) => setForm({ ...form, scoreA: e.target.value === "" ? undefined : Number(e.target.value) })} className="input-dark w-10 h-9 text-center text-sm font-black" placeholder="0" />
                        <span className="text-sm font-black text-gray-500">vs</span>
                        <input type="number" min={0} value={form.scoreB ?? ""} onChange={(e) => setForm({ ...form, scoreB: e.target.value === "" ? undefined : Number(e.target.value) })} className="input-dark w-10 h-9 text-center text-sm font-black" placeholder="0" />
                      </div>
                      <input value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })} className="input-dark w-full px-3 py-2 text-sm" placeholder="Nome da equipa B" disabled={!!form.eventId && !editingLive} />
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Tempo de jogo</label>
                      <input value={form.matchTime} onChange={(e) => setForm({ ...form, matchTime: e.target.value })} className="input-dark w-full px-3 py-2 text-xs" placeholder="Ex: 45'" />
                    </div>
                  </div>

                  {/* Date + Featured */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-400">Data e hora <span className="text-[#E50914]">*</span></label>
                    <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 hover:bg-amber-500/[0.08] transition-colors">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-[#E50914] rounded" />
                    <div>
                      <span className="text-sm font-semibold text-amber-300">Destacar na homepage</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">Aparece no Hero e na secção de destaques</p>
                    </div>
                  </label>
                </>
              )}

              {/* ── TAB: STREAMING ── */}
              {modalTab === "Streaming" && (
                <>
                  {/* YouTube */}
                  <div className="rounded-xl border border-red-500/10 bg-[#1A0A0A] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      <h4 className="text-sm font-bold text-white">YouTube / Embed</h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Transmita a partir de um vídeo do YouTube ou código iframe.</p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">URL do YouTube</label>
                        <input value={form.youtubeUrl} onChange={(e) => { const url = e.target.value; let embed = ""; const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/); if (m) embed = `https://www.youtube.com/embed/${m[1]}`; setForm({ ...form, youtubeUrl: url, youtubeEmbed: embed || form.youtubeEmbed }); }} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="https://www.youtube.com/watch?v=..." />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">URL Embed ou código iframe</label>
                        <input value={form.youtubeEmbed} onChange={(e) => setForm({ ...form, youtubeEmbed: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm font-mono" placeholder="https://www.youtube.com/embed/..." />
                      </div>
                    </div>
                  </div>

                  {/* Stream Servers */}
                  <div className="rounded-xl border border-[#E50914]/10 bg-[#E50914]/[0.03] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Server className="h-4 w-4 text-[#E50914]" />
                      <h4 className="text-sm font-bold text-white">Servidores de Stream</h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Adicione servidores HLS/M3U8. O utilizador poderá escolher entre eles no player.</p>

                    <div className="space-y-3">
                      {form.streamServers.map((server, index) => (
                        <div key={server.id} className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E50914]/15 text-[10px] font-black text-[#E50914]">{index + 1}</span>
                              <span className="text-xs font-bold text-gray-300">{server.name || `Servidor ${index + 1}`}</span>
                            </div>
                            <button type="button" onClick={() => setForm({ ...form, streamServers: form.streamServers.length > 1 ? form.streamServers.filter((s) => s.id !== server.id) : [{ ...server, url: "" }] })} className="rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"><Trash2 className="h-3 w-3 inline mr-1" />Remover</button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">URL do Stream (HLS/M3U8)</label>
                              <input value={server.url} onChange={(e) => setForm({ ...form, streamServers: form.streamServers.map((s) => s.id === server.id ? { ...s, url: e.target.value } : s) })} className="input-dark w-full px-3 py-2.5 text-sm font-mono" placeholder="https://example.com/live.m3u8" />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Nome</label>
                              <input value={server.name} onChange={(e) => setForm({ ...form, streamServers: form.streamServers.map((s) => s.id === server.id ? { ...s, name: e.target.value } : s) })} className="input-dark w-full px-3 py-2 text-sm" placeholder="Servidor Principal" />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold text-gray-500 uppercase">Qualidade</label>
                              <input value={server.quality || ""} onChange={(e) => setForm({ ...form, streamServers: form.streamServers.map((s) => s.id === server.id ? { ...s, quality: e.target.value } : s) })} className="input-dark w-full px-3 py-2 text-sm" placeholder="Full HD · 1080p" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={() => setForm({ ...form, streamServers: [...form.streamServers, createStreamServer(form.streamServers.length)] })} className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-xs font-semibold text-gray-500 hover:border-[#E50914]/40 hover:text-[#E50914] hover:bg-[#E50914]/5 transition-all">
                      <Plus className="h-4 w-4" /> Adicionar servidor
                    </button>
                  </div>
                </>
              )}

              {/* ── TAB: DETALHES ── */}
              {modalTab === "Detalhes" && (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-400">Descrição da transmissão</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} maxLength={1000} className="input-dark w-full resize-none px-3 py-2.5 text-sm" placeholder="Informações sobre a transmissão, contexto do jogo, observações..." />
                    <p className="text-right text-[10px] text-gray-600">{form.description.length} / 1000</p>
                  </div>

                  <AdminImageField label="Banner (formato wide)" value={form.banner} onChange={(v) => setForm({ ...form, banner: v })} aspectClassName="aspect-[21/9]" sizeHint={IMAGE_SIZE_PRESETS.siteBanner} />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <AdminImageField label="Logo da Liga" value={form.leagueLogo} onChange={(v) => setForm({ ...form, leagueLogo: v })} aspectClassName="aspect-square" sizeHint={{ width: 128, height: 128 }} compact />
                    <AdminImageField label="Escudo Equipa A" value={form.teamALogo} onChange={(v) => setForm({ ...form, teamALogo: v })} aspectClassName="aspect-square" sizeHint={{ width: 128, height: 128 }} compact />
                    <AdminImageField label="Escudo Equipa B" value={form.teamBLogo} onChange={(v) => setForm({ ...form, teamBLogo: v })} aspectClassName="aspect-square" sizeHint={{ width: 128, height: 128 }} compact />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[#1E1E2A] px-5 py-4">
              <div className="flex gap-1.5">
                {(["Geral", "Streaming", "Detalhes"] as const).map((tab) => (
                  <button key={tab} onClick={() => setModalTab(tab)} className={`h-1.5 rounded-full transition-all ${modalTab === tab ? "w-6 bg-red-500" : "w-1.5 bg-white/15"}`} />
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:border-white/15 transition-all">Cancelar</button>
                <button onClick={handleSave} className="rounded-xl bg-[#E50914] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.25)] hover:bg-[#C50010] transition-all">{editingLive ? "Guardar Alterações" : "Criar Live"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <SyncCompetitionsModal
          title="Importar Streams"
          providerDefinitions={LIVES_PROVIDERS}
          summaryItems={["Streams ao vivo", "Transmissões M3U8", "CDN / Hosting"]}
          summaryLabel="Streams"
          onClose={() => setShowSyncModal(false)}
          onNoApiKey={() => {
            setShowSyncModal(false);
            setApiKeyModalOpen(true);
          }}
          onSyncProvider={syncLiveProvider}
          onSyncComplete={(results) => {
            const total = results.reduce((acc, r) => acc + r.added, 0);
            toast.success(`${total} stream(s) importado(s) com sucesso!`);
          }}
        />
      )}

      {/* API Key Required Modal */}
      {apiKeyModalOpen && (
        <ApiKeyRequiredModal
          context="Importar Streams"
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

