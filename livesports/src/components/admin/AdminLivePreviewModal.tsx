"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, X } from "lucide-react";
import type { Live } from "@/types";
import { formatDateTime, formatNumber, getSportLabel } from "@/utils";
import LivePlayer from "@/components/watch/LivePlayer";
import { apiRequest } from "@/lib/api";

interface AdminLivePreviewModalProps {
  live: Live;
  onClose: () => void;
}

export default function AdminLivePreviewModal({ live, onClose }: AdminLivePreviewModalProps) {
  const [previewLive, setPreviewLive] = useState<Live>(live);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPreviewLive(live);
    setLoading(true);
    apiRequest<Live>(`/lives/${live.id}`)
      .then(setPreviewLive)
      .catch(() => setPreviewLive(live))
      .finally(() => setLoading(false));
  }, [live]);

  const display = previewLive;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#171717] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Pré-visualização</p>
            <h3 className="truncate text-lg font-bold text-white">{display.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span>{getSportLabel(display.sport)}</span>
              {display.league && (
                <>
                  <span>·</span>
                  <span>{display.league}</span>
                </>
              )}
              <span>·</span>
              <span>{formatDateTime(display.scheduledAt)}</span>
              <span>·</span>
              <span>{formatNumber(display.viewerCount)} espectadores</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar pré-visualização"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="aspect-video w-full max-h-[min(56vh,520px)] border-b border-white/10 bg-black">
            {loading ? (
              <div className="flex h-full min-h-[240px] items-center justify-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
                A carregar stream...
              </div>
            ) : (
              <LivePlayer key={display.id} live={display} autoPlayMuted />
            )}
          </div>

          {(display.teamA || display.teamB) && (
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Confronto</p>
              <p className="mt-1 text-sm font-bold text-white">
                {display.teamA || "—"}
                {typeof display.scoreA === "number" && typeof display.scoreB === "number"
                  ? ` ${display.scoreA} – ${display.scoreB} `
                  : " vs "}
                {display.teamB || "—"}
                {display.matchTime ? <span className="ml-2 text-[#E50914]">{display.matchTime}</span> : null}
              </p>
            </div>
          )}

          {display.description && (
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Descrição</p>
              <p className="mt-1 text-sm text-gray-300">{display.description}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 p-5">
          <Link
            href={`/watch/${display.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir página pública
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B00000]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
