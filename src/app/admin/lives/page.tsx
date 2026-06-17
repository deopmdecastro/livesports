"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { cn, formatDateTime, formatNumber, getSportLabel } from "@/utils";
import type { Live, LiveStatus, LiveStreamServer, SportCategory, Event } from "@/types";
import toast from "react-hot-toast";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { apiRequest, type ApiListResponse } from "@/lib/api";

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
    className: "border-sky-500/30 bg-sky-500/15 text-sky-200",
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

  // Event select/search state (Nova Live)
  const [eventQuery, setEventQuery] = useState("");
  const [eventSearchLoading, setEventSearchLoading] = useState(false);
  const [eventOptions, setEventOptions] = useState<Event[]>([]);

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
    if (!q) {
      setEventOptions([]);
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
      streamServers:
        live.streamServers && live.streamServers.length > 0
          ? live.streamServers
          : [
              createStreamServer(0, live.hlsUrl || live.m3u8Url || live.streamUrl || DEFAULT_STREAM_URL),
            ],
      scheduledAt: live.scheduledAt.slice(0, 16),
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
    if (!form.eventId) {
      toast.error("Selecione um evento para criar a live.");
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

    if (cleanServers.length === 0 && !form.hlsUrl.trim() && !form.m3u8Url.trim()) {
      toast.error("Adicione pelo menos um servidor com URL de transmissao.");
      return;
    }

    const payload = {
      eventId: form.eventId,
      sport: form.sport,
      league: form.league || null,
      leagueLogo: form.leagueLogo || null,
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

            <button
              onClick={handleCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#E50914] px-4 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition-colors hover:bg-[#B00000]"
            >
              <Plus className="h-4 w-4" />
              Nova Live
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Transmissoes", value: lives.length, helper: `${filtered.length} visiveis nos filtros`, icon: Radio, tone: "text-sky-300" },
              { label: "Ao vivo agora", value: liveNowCount, helper: `${formatNumber(totalViewers)} espectadores`, icon: Users, tone: "text-red-300" },
              { label: "Agendadas", value: scheduledCount, helper: nextLive ? `Proxima: ${formatDateTime(nextLive.scheduledAt)}` : "Sem proximas lives", icon: CalendarClock, tone: "text-blue-300" },
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
                              {isImageValue(live.teamALogo) && <img src={live.teamALogo} alt="" className="h-4 w-4 rounded-full object-cover" />}
                              {live.teamA} vs {live.teamB}
                              {isImageValue(live.teamBLogo) && <img src={live.teamBLogo} alt="" className="h-4 w-4 rounded-full object-cover" />}
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
                      {isImageValue(live.leagueLogo) && <img src={live.leagueLogo} alt="" className="h-5 w-5 rounded object-cover" />}
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
                      <AdminActionButton title="Ver live" tone="view">
                        <Eye className="h-4 w-4" />
                      </AdminActionButton>
                      <AdminActionButton title="Editar live" onClick={() => handleEdit(live)} tone="edit">
                        <Edit2 className="h-4 w-4" />
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

          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Radio className="mx-auto mb-3 h-9 w-9 text-gray-600" />
              <p className="text-sm font-semibold text-gray-300">Nenhuma live encontrada</p>
              <p className="mt-1 text-xs text-gray-500">Ajuste os filtros ou crie uma nova transmissao.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#171717] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3 className="text-lg font-bold text-white">{editingLive ? "Editar Live" : "Nova Live"}</h3>
                <p className="text-xs text-gray-500">Preencha os dados principais da transmissao.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              {!editingLive && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-300">Evento *</label>
                      <p className="text-xs text-gray-500">Pesquise entre eventos registrados e vincule a live.</p>
                    </div>
                    {eventSearchLoading && (
                      <span className="text-xs text-red-300">A pesquisar...</span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      value={eventQuery}
                      onChange={(e) => setEventQuery(e.target.value)}
                      placeholder="Buscar por titulo, equipa ou liga"
                      className="input-dark h-11 w-full pl-9 pr-4 text-sm"
                    />
                  </div>

                  <div className="mt-3">
                    <AdminSelect
                      value={form.eventId}
                      onChange={(value) => {
                        setForm((prev) => ({ ...prev, eventId: value }));
                        handlePickEvent(value);
                      }}
                      options={
                        eventOptions.length
                          ? eventOptions.map((ev) => ({
                              value: ev.id,
                              label: `${ev.title}`,
                            }))
                          : [{ value: "", label: "Selecione um evento" }]
                      }
                      disabled={eventOptions.length === 0}
                      ariaLabel="Selecionar evento"
                    />
                  </div>
                </div>
              )}

              {editingLive && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Titulo</label>
                  <input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
              )}

              <AdminImageField
                label="Capa"
                value={form.thumbnail}
                onChange={(value) => setForm({ ...form, thumbnail: value, banner: value })}
                aspectClassName="aspect-video"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Desporto</label>
                  <AdminSelect
                    value={form.sport}
                    onChange={(value) => setForm({ ...form, sport: value as SportCategory })}
                    options={sportOptions}
                    ariaLabel="Selecionar desporto"
                    disabled={!editingLive}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Liga</label>
                  <input
                    value={form.league}
                    onChange={(event) => setForm({ ...form, league: event.target.value })}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="Ex: Premier League"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Time A</label>
                  <input
                    value={form.teamA}
                    onChange={(e) => setForm({ ...form, teamA: e.target.value })}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="Time A"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-300">Time B</label>
                  <input
                    value={form.teamB}
                    onChange={(e) => setForm({ ...form, teamB: e.target.value })}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="Time B"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-[#E50914]" />
                      <h4 className="text-sm font-bold text-white">Servidores do player</h4>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Estes servidores aparecem no player para o utilizador escolher.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        streamServers: [...form.streamServers, createStreamServer(form.streamServers.length)],
                      })
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold text-white transition-colors hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar servidor
                  </button>
                </div>

                <div className="space-y-3">
                  {form.streamServers.map((server, index) => (
                    <div key={server.id} className="rounded-lg border border-white/10 bg-[#141414] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500">Servidor {index + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              streamServers:
                                form.streamServers.length > 1
                                  ? form.streamServers.filter((item) => item.id !== server.id)
                                  : [{ ...server, name: "Servidor 1", url: "", quality: "Auto HD", latency: "Baixa" }],
                            })
                          }
                          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Apagar
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Nome</label>
                          <input
                            value={server.name}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                streamServers: form.streamServers.map((item) => (item.id === server.id ? { ...item, name: event.target.value } : item)),
                              })
                            }
                            className="input-dark w-full px-3 py-2.5 text-sm"
                            placeholder="Ex: Servidor Auto"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-300">URL do stream *</label>
                          <input
                            value={server.url}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                streamServers: form.streamServers.map((item) => (item.id === server.id ? { ...item, url: event.target.value } : item)),
                              })
                            }
                            className="input-dark w-full px-3 py-2.5 text-sm"
                            placeholder="https://example.com/live.m3u8"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Qualidade</label>
                          <input
                            value={server.quality || ""}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                streamServers: form.streamServers.map((item) => (item.id === server.id ? { ...item, quality: event.target.value } : item)),
                              })
                            }
                            className="input-dark w-full px-3 py-2.5 text-sm"
                            placeholder="Ex: Full HD"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Latencia</label>
                          <input
                            value={server.latency || ""}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                streamServers: form.streamServers.map((item) => (item.id === server.id ? { ...item, latency: event.target.value } : item)),
                              })
                            }
                            className="input-dark w-full px-3 py-2.5 text-sm"
                            placeholder="Ex: Baixa"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Data e hora *</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Descricao</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={3}
                  className="input-dark w-full resize-none px-3 py-2.5 text-sm"
                  placeholder="Resumo da transmissao"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => setForm({ ...form, featured: event.target.checked })}
                  className="h-4 w-4 accent-[#E50914]"
                />
                <span className="text-sm font-medium text-gray-300">Destacar na homepage</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 p-5">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B00000]"
              >
                {editingLive ? "Salvar alteracoes" : "Criar live"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

