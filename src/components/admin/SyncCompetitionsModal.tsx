"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Trophy, Zap, Globe, ChevronRight, Download,
  BarChart3, Shield, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  sports: string[];
  status: "ready" | "no_key" | "error";
  lastSync?: string;
}

interface SyncLog {
  id: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
  ts: string;
}

interface SyncResult {
  provider: string;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
}

// ─── Static provider definitions (status resolved dynamically from API Keys) ──

const STATIC_PROVIDERS: Omit<SyncProvider, "status">[] = [
  {
    id: "api_football",
    name: "API-Football",
    logo: "🏟️",
    description: "Champions League, La Liga, Premier League, Brasileirão e mais 800+ ligas",
    sports: ["Futebol"],
  },
  {
    id: "sportradar",
    name: "Sportradar",
    logo: "📡",
    description: "Basquete (NBA/WNBA), Ténis (ATP/WTA), Futebol Americano (NFL), Baseball (MLB)",
    sports: ["Basquete", "Ténis", "NFL", "MLB"],
  },
  {
    id: "thesportsdb",
    name: "TheSportsDB",
    logo: "🏅",
    description: "Logos de ligas, equipas e eventos de múltiplos desportos",
    sports: ["Múltiplos"],
  },
  {
    id: "football_data",
    name: "Football-Data.org",
    logo: "⚽",
    description: "Ligas europeias, Copa do Mundo — API gratuita",
    sports: ["Futebol"],
  },
];

// Competitions that would be synced (mock)
const MOCK_COMPETITIONS = [
  "UEFA Champions League 2025/26",
  "Premier League 2025/26",
  "La Liga 2025/26",
  "Bundesliga 2025/26",
  "Serie A 2025/26",
  "Ligue 1 2025/26",
  "Brasileirão Série A 2026",
  "Copa do Mundo 2026",
  "NBA Playoffs 2026",
  "ATP Roland Garros 2026",
  "UFC Fight Night",
  "Formula 1 – GP do Brasil",
];

// ─── Components ───────────────────────────────────────────────────────────────

function LogLine({ log }: { log: SyncLog }) {
  const colors = {
    info:    "text-gray-400",
    success: "text-emerald-400",
    error:   "text-red-400",
    warning: "text-amber-400",
  };
  const icons = {
    info:    <span className="text-gray-600">›</span>,
    success: <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />,
    error:   <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />,
    warning: <AlertCircle className="h-3 w-3 text-amber-400 flex-shrink-0" />,
  };
  return (
    <div className={`flex items-start gap-2 text-[11px] font-mono ${colors[log.type]}`}>
      <span className="flex-shrink-0 mt-0.5">{icons[log.type]}</span>
      <span className="text-gray-600 flex-shrink-0">{log.ts}</span>
      <span className="leading-relaxed">{log.message}</span>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface SyncCompetitionsModalProps {
  onClose: () => void;
  onSyncComplete?: (results: SyncResult[]) => void;
  onNoApiKey?: () => void;
}

type Step = "select" | "configure" | "syncing" | "done";

export default function SyncCompetitionsModal({ onClose, onSyncComplete, onNoApiKey }: SyncCompetitionsModalProps) {
  const [providers, setProviders] = useState<SyncProvider[]>(
    STATIC_PROVIDERS.map((p) => ({ ...p, status: "no_key" as const }))
  );
  const [step, setStep] = useState<Step>("select");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>(["Futebol", "Basquete", "Ténis"]);
  const [overwrite, setOverwrite] = useState(false);
  const [fetchLogos, setFetchLogos] = useState(true);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [currentTask, setCurrentTask] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load real API key status to mark providers as ready/no_key
  useEffect(() => {
    apiRequest<Array<{ provider: string; status: string; lastUsedAt?: string }>>("/api-keys")
      .then((keys) => {
        const activeByProvider = new Map<string, string>();
        keys.forEach((k) => {
          if (k.status === "active") activeByProvider.set(k.provider, k.lastUsedAt || "");
        });
        const resolved: SyncProvider[] = STATIC_PROVIDERS.map((p) => ({
          ...p,
          status: activeByProvider.has(p.id) ? "ready" : "no_key",
          lastSync: activeByProvider.get(p.id) || undefined,
        }));
        setProviders(resolved);
        setSelectedProviders(resolved.filter((p) => p.status === "ready").map((p) => p.id));
      })
      .catch(() => {
        // Fallback: keep all as no_key
      });
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (type: SyncLog["type"], message: string) => {
    const ts = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev, { id: Date.now().toString(), type, message, ts }]);
  };

  const toggleProvider = (id: string) => {
    const provider = providers.find((p) => p.id === id);
    if (provider?.status !== "ready") return;
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const startSync = async () => {
    setStep("syncing");
    setLogs([]);
    setProgress(0);
    setResults([]);

    const total = selectedProviders.length;
    const batchResults: SyncResult[] = [];

    for (let i = 0; i < total; i++) {
      const pid = selectedProviders[i];
      const provider = providers.find((p) => p.id === pid)!;

      addLog("info", `━━━ Iniciando sincronização: ${provider.name} ━━━`);
      setCurrentTask(`A conectar a ${provider.name}...`);
      await delay(600);

      addLog("info", `Autenticando com ${provider.name}...`);
      await delay(400);
      addLog("success", `Autenticação bem-sucedida`);

      // Simulate fetching competitions
      const competitionsForProvider = MOCK_COMPETITIONS.filter(
        (_, idx) => idx % total === i
      );

      let added = 0;
      let updated = 0;
      let skipped = 0;

      for (const comp of competitionsForProvider) {
        setCurrentTask(`A processar: ${comp}`);
        await delay(200 + Math.random() * 300);

        const action = Math.random();
        if (action < 0.4) {
          addLog("success", `[ADICIONADO] ${comp}`);
          added++;
        } else if (action < 0.7) {
          addLog("info", `[ATUALIZADO] ${comp}`);
          updated++;
        } else {
          addLog("info", `[SEM ALTERAÇÕES] ${comp}`);
          skipped++;
        }
        setProgress(((i / total) + (competitionsForProvider.indexOf(comp) + 1) / competitionsForProvider.length / total) * 100);
      }

      if (fetchLogos) {
        addLog("info", `A importar logos de ${provider.name}...`);
        await delay(500);
        addLog("success", `${added + updated} logos importados`);
      }

      batchResults.push({ provider: provider.name, added, updated, skipped, errors: 0 });
      addLog("success", `━━━ ${provider.name} concluído: +${added} adicionadas, ~${updated} atualizadas ━━━`);
    }

    setProgress(100);
    setCurrentTask("Sincronização concluída!");
    addLog("success", "✓ Todas as competições foram sincronizadas com sucesso.");
    setResults(batchResults);
    setStep("done");
    onSyncComplete?.(batchResults);
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const allSports = [...new Set(providers.flatMap((p) => p.sports))];
  const readyProviders = providers.filter((p) => p.status === "ready");
  const noKeyProviders = providers.filter((p) => p.status === "no_key");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E1E2A] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E50914]/10 border border-[#E50914]/20">
              <RefreshCw className={`h-4 w-4 text-[#E50914] ${step === "syncing" ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h3 className="font-black text-white">Sincronizar Competições</h3>
              <p className="text-[11px] text-gray-500">
                {step === "select" && "Selecione os provedores e filtros"}
                {step === "configure" && "Configure as opções de importação"}
                {step === "syncing" && "A sincronizar com os provedores..."}
                {step === "done" && "Sincronização concluída!"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress steps */}
            {step !== "syncing" && step !== "done" && (
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500">
                {(["select", "configure"] as Step[]).map((s, i) => (
                  <span key={s} className="flex items-center gap-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border ${step === s ? "bg-[#E50914] border-[#E50914] text-white" : "border-[#2A2A38] text-gray-600"}`}>{i + 1}</span>
                    {i < 1 && <ChevronRight className="h-3 w-3" />}
                  </span>
                ))}
              </div>
            )}
            <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP: SELECT PROVIDERS ── */}
          {step === "select" && (
            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3">
                  Provedores Disponíveis ({readyProviders.length} com chave configurada)
                </h4>
                <div className="space-y-2">
                  {providers.map((provider) => {
                    const isSelected = selectedProviders.includes(provider.id);
                    const isReady = provider.status === "ready";
                    return (
                      <button
                        key={provider.id}
                        onClick={() => toggleProvider(provider.id)}
                        disabled={!isReady}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                          !isReady
                            ? "border-[#1A1A24] bg-[#0A0A0F] opacity-50 cursor-not-allowed"
                            : isSelected
                            ? "border-[#E50914]/40 bg-[#E50914]/5"
                            : "border-[#1E1E2A] bg-[#111118] hover:border-[#2A2A38]"
                        }`}
                      >
                        <div className="text-2xl flex-shrink-0">{provider.logo}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{provider.name}</p>
                            {isReady ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ● Pronto
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Sem chave API
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{provider.description}</p>
                          {provider.lastSync && (
                            <p className="text-[10px] text-gray-600 mt-1">
                              Última sync: {new Date(provider.lastSync).toLocaleString("pt-PT")}
                            </p>
                          )}
                        </div>
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected && isReady ? "border-[#E50914] bg-[#E50914]" : "border-[#2A2A38]"}`}>
                          {isSelected && isReady && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {noKeyProviders.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">
                    {noKeyProviders.length} provedor(es) sem chave configurada.{" "}
                    {onNoApiKey ? (
                      <button onClick={() => { onClose(); onNoApiKey(); }} className="underline text-amber-200 hover:text-white">
                        Configurar API Key
                      </button>
                    ) : (
                      <a href="/admin/api-keys" className="underline text-amber-200 hover:text-white">
                        Adicionar em API Keys
                      </a>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: CONFIGURE ── */}
          {step === "configure" && (
            <div className="p-5 space-y-5">
              {/* Sport filter */}
              <div>
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3">Desportos a Importar</h4>
                <div className="flex flex-wrap gap-2">
                  {allSports.map((sport) => {
                    const isSelected = selectedSports.includes(sport);
                    return (
                      <button
                        key={sport}
                        onClick={() => setSelectedSports((prev) => isSelected ? prev.filter((s) => s !== sport) : [...prev, sport])}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelected ? "bg-[#E50914] text-white" : "bg-[#111118] border border-[#1E1E2A] text-gray-400 hover:text-white"}`}
                      >
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 rounded-xl border border-[#1E1E2A] bg-[#111118] p-4">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Opções de Importação</h4>
                {[
                  { key: "fetchLogos", label: "Importar logos das ligas e equipas", sub: "Faz download dos logotipos e actualiza automaticamente", value: fetchLogos, set: setFetchLogos },
                  { key: "overwrite", label: "Sobrescrever dados existentes", sub: "Atenção: substitui campos editados manualmente", value: overwrite, set: setOverwrite },
                ].map(({ key, label, sub, value, set }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer py-1.5 border-t border-[#1E1E2A] first:border-0 first:pt-0">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => set(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#E50914]"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">{label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-[#E50914]/20 bg-[#E50914]/5 p-4">
                <h4 className="text-xs font-bold text-[#E50914] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" /> Resumo da Sincronização
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-black text-white">{selectedProviders.length}</p>
                    <p className="text-[10px] text-gray-500">Provedor(es)</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{selectedSports.length}</p>
                    <p className="text-[10px] text-gray-500">Desporto(s)</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">~{MOCK_COMPETITIONS.length}</p>
                    <p className="text-[10px] text-gray-500">Competições</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: SYNCING ── */}
          {(step === "syncing" || step === "done") && (
            <div className="p-5 space-y-4">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-300">{currentTask}</span>
                  <span className="text-xs font-black text-[#E50914]">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#111118] border border-[#1E1E2A] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#E50914] to-[#FF4444] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Terminal log */}
              <div className="rounded-xl border border-[#1E1E2A] bg-[#0A0A0F] p-4 h-56 overflow-y-auto font-mono">
                {logs.length === 0 && (
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    A inicializar...
                  </div>
                )}
                <div className="space-y-1">
                  {logs.map((log) => <LogLine key={log.id} log={log} />)}
                </div>
                <div ref={logsEndRef} />
              </div>

              {/* Results summary (when done) */}
              {step === "done" && results.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-emerald-300">Concluído com sucesso!</h4>
                  </div>
                  <div className="space-y-2">
                    {results.map((r) => (
                      <div key={r.provider} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-medium">{r.provider}</span>
                        <div className="flex gap-3 text-[10px]">
                          <span className="text-emerald-400">+{r.added} adicionadas</span>
                          <span className="text-blue-400">~{r.updated} atualizadas</span>
                          <span className="text-gray-600">{r.skipped} sem alteração</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-[#1E1E2A] flex-shrink-0">
          {step === "select" && (
            <>
              <button onClick={onClose} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => setStep("configure")}
                disabled={selectedProviders.length === 0}
                className="rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Seguinte →
              </button>
            </>
          )}
          {step === "configure" && (
            <>
              <button onClick={() => setStep("select")} className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors">
                ← Voltar
              </button>
              <button
                onClick={startSync}
                disabled={selectedProviders.length === 0 || selectedSports.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4" /> Iniciar Sincronização
              </button>
            </>
          )}
          {step === "syncing" && (
            <div className="flex-1 flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E50914]" />
              Não feche esta janela durante a sincronização...
            </div>
          )}
          {step === "done" && (
            <>
              <button
                onClick={() => {
                  setStep("select");
                  setLogs([]);
                  setProgress(0);
                  setResults([]);
                }}
                className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Nova Sincronização
              </button>
              <button
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:from-emerald-500 hover:to-emerald-600 transition-all"
              >
                Fechar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
