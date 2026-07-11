"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Database, RefreshCw, ScrollText, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface LogItem {
  id: string;
  level: string;
  service: string;
  message: string;
  requestId?: string;
  ip?: string;
  createdAt: string;
}

interface LogsResponse {
  items: LogItem[];
  pagination?: {
    total: number;
  };
}

interface LogStatsResponse {
  total: number;
  errors: number;
  warnings: number;
  fatals: number;
  lastHour: number;
  last24h: number;
  byService: Array<{ service: string; count: number }>;
}

interface ApiConsumptionResponse {
  keys: Array<{
    id: string;
    name: string;
    provider: string;
    requestsUsed: number;
    requestLimit: number | null;
    usagePercent: number | null;
    errorCount: number;
    lastUsedAt?: string | null;
    status: string;
  }>;
}

const LEVEL_COLORS: Record<string, string> = {
  debug: "text-gray-400",
  info: "text-sky-300",
  warn: "text-yellow-300",
  error: "text-red-400",
  fatal: "text-red-500",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [stats, setStats] = useState<LogStatsResponse | null>(null);
  const [apiConsumption, setApiConsumption] = useState<ApiConsumptionResponse["keys"]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, statsData, apiData] = await Promise.all([
        apiRequest<LogsResponse>("/logs?limit=100"),
        apiRequest<LogStatsResponse>("/logs/stats"),
        apiRequest<ApiConsumptionResponse>("/reports/api-consumption"),
      ]);
      setLogs(logsData.items || []);
      setStats(statsData);
      setApiConsumption(apiData.keys || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const failingApis = apiConsumption.filter((key) => key.errorCount > 0 || key.status !== "active");
  const exhaustedApis = apiConsumption.filter((key) => key.requestLimit && key.requestsUsed >= key.requestLimit);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-white">
            <ScrollText className="h-5 w-5 text-[#E50914]" /> Logs & Consumo de APIs
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">Erros reais, avisos operacionais e saúde das integrações</p>
        </div>
        <button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#111118] px-4 py-2 text-sm text-gray-300 hover:text-white">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { label: "Total", value: stats?.total || 0, color: "text-white" },
          { label: "Erros", value: stats?.errors || 0, color: "text-red-400" },
          { label: "Warnings", value: stats?.warnings || 0, color: "text-yellow-300" },
          { label: "Fatal", value: stats?.fatals || 0, color: "text-red-500" },
          { label: "APIs falhando", value: failingApis.length, color: "text-orange-300" },
          { label: "APIs esgotadas", value: exhaustedApis.length, color: "text-amber-300" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] xl:col-span-2">
          <div className="flex items-center justify-between border-b border-[#1E1E2A] p-4">
            <div>
              <h2 className="text-sm font-bold text-white">Eventos recentes</h2>
              <p className="text-[10px] text-gray-500">Últimos 100 eventos do sistema</p>
            </div>
            <span className="text-[10px] text-gray-500">24h: {stats?.last24h || 0}</span>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[#1E1E2A]">
                  {['Nível', 'Serviço', 'Mensagem', 'Request ID', 'Data'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-600">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#1A1A2A] last:border-0 hover:bg-white/[0.02]">
                    <td className={`px-4 py-3 text-xs font-bold uppercase ${LEVEL_COLORS[log.level] || "text-gray-300"}`}>{log.level}</td>
                    <td className="px-4 py-3 text-xs text-gray-300">{log.service}</td>
                    <td className="px-4 py-3 text-xs text-gray-300">{log.message}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-500">{log.requestId || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString('pt-PT')}</td>
                  </tr>
                ))}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">Sem logs recentes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><AlertTriangle className="h-4 w-4 text-yellow-300" /> Por serviço</h2>
            <div className="space-y-2">
              {(stats?.byService || []).map((service) => (
                <div key={service.service} className="flex items-center justify-between rounded-lg bg-[#111118] px-3 py-2">
                  <span className="text-xs text-gray-300">{service.service}</span>
                  <span className="text-xs font-bold text-white">{service.count}</span>
                </div>
              ))}
              {!stats?.byService?.length && <p className="text-xs text-gray-500">Sem distribuição disponível</p>}
            </div>
          </div>

          <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><WifiOff className="h-4 w-4 text-orange-300" /> Integrações com falhas</h2>
            <div className="space-y-2">
              {failingApis.map((key) => (
                <div key={key.id} className="rounded-lg border border-[#2A2A2A] bg-[#111118] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white">{key.name}</p>
                      <p className="text-[10px] text-gray-500">{key.provider}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${key.status === 'active' ? 'bg-yellow-500/15 text-yellow-300' : 'bg-red-500/15 text-red-400'}`}>
                      {key.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Erros: {key.errorCount}</span>
                    <span>{key.requestLimit ? `${key.requestsUsed}/${key.requestLimit}` : `${key.requestsUsed} req.`}</span>
                  </div>
                </div>
              ))}
              {failingApis.length === 0 && <p className="text-xs text-gray-500">Nenhuma integração com falha no momento</p>}
            </div>
          </div>

          <div className="rounded-xl border border-[#1E1E2A] bg-[#0E0E16] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Database className="h-4 w-4 text-cyan-300" /> Consumo das APIs</h2>
            <div className="space-y-2">
              {apiConsumption.map((key) => (
                <div key={key.id} className="rounded-lg bg-[#111118] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{key.name}</span>
                    <span className="text-[10px] text-gray-500">{key.usagePercent ?? 0}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1E1E2A]">
                    <div className={`h-full rounded-full ${key.errorCount > 0 ? 'bg-red-500' : 'bg-[#E50914]'}`} style={{ width: `${Math.min(100, key.usagePercent ?? 0)}%` }} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                    <span>{key.provider}</span>
                    <span>{key.requestLimit ? `${key.requestsUsed}/${key.requestLimit}` : `${key.requestsUsed} req.`}</span>
                  </div>
                </div>
              ))}
              {!apiConsumption.length && <p className="text-xs text-gray-500">Nenhuma API configurada</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
