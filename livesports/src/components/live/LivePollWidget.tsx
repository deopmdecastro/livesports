"use client";

import { useEffect, useState } from "react";
import { BarChart3, X, CheckCircle, Clock, Users } from "lucide-react";
import { cn } from "@/utils";
import type { RealtimePoll } from "@/hooks/useRealtimePoll";

interface LivePollWidgetProps {
  poll: RealtimePoll;
  votedOptionId: string | null;
  onVote: (pollId: string, optionId: string) => void;
  onDismiss: () => void;
  voting?: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function useCountdown(endsAt?: string) {
  const [secsLeft, setSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const update = () => {
      const diff = Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000);
      setSecsLeft(Math.max(0, diff));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (secsLeft === null) return null;
  const m = Math.floor(secsLeft / 60);
  const s = secsLeft % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LivePollWidget({
  poll,
  votedOptionId,
  onVote,
  onDismiss,
  voting = false,
}: LivePollWidgetProps) {
  const [entered, setEntered] = useState(false);
  const countdown = useCountdown(poll.endsAt);
  const hasVoted = Boolean(votedOptionId);
  const isEnded = poll.status === "ended";
  const showResults = hasVoted || isEnded;

  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);
  const leadingId =
    showResults && poll.totalVotes > 0
      ? poll.options.reduce((a, b) => (b.votes > a.votes ? b : a)).id
      : null;

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all duration-500",
        isEnded
          ? "border-gray-500/30 bg-[#0D0D14]"
          : "border-[#E50914]/40 bg-[#0D0D14] shadow-[0_0_24px_rgba(229,9,20,0.12)]",
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Top accent bar */}
      {!isEnded && (
        <div className="h-0.5 bg-gradient-to-r from-[#E50914] via-[#FF4550] to-transparent" />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
            isEnded ? "bg-gray-600/20" : "bg-[#E50914]/15"
          )}>
            <BarChart3 className={cn("w-3 h-3", isEnded ? "text-gray-500" : "text-[#E50914]")} />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!isEnded ? (
              <>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#E50914]">
                  Sondagem
                </span>
                {countdown !== null && (
                  <span className="flex items-center gap-1 text-[9px] text-gray-500">
                    <Clock className="w-2.5 h-2.5" />
                    {countdown}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                Sondagem Encerrada
              </span>
            )}
          </div>
          {poll.totalVotes > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500 flex-shrink-0">
              <Users className="w-3 h-3" />
              {formatNumber(poll.totalVotes)}
            </span>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
          aria-label="Fechar sondagem"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Question */}
      <p className="px-4 pb-3 text-sm font-bold text-white leading-snug">
        {poll.question}
      </p>

      {/* Options */}
      <div className="px-3 pb-4 space-y-2">
        {poll.options.map((option) => {
          const pct = poll.totalVotes > 0
            ? Math.round((option.votes / poll.totalVotes) * 100)
            : 0;
          const isVoted = votedOptionId === option.id;
          const isLeading = option.id === leadingId;

          if (showResults) {
            return (
              <div key={option.id} className={cn(
                "relative rounded-xl overflow-hidden border transition-all",
                isVoted
                  ? "border-[#E50914]/40 bg-[#E50914]/5"
                  : isLeading && !isEnded
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-[#1E1E2A] bg-[#111118]"
              )}>
                {/* Background fill bar */}
                <div
                  className={cn(
                    "absolute inset-0 origin-left transition-all duration-700",
                    isVoted
                      ? "bg-[#E50914]/10"
                      : isLeading
                      ? "bg-emerald-500/8"
                      : "bg-white/3"
                  )}
                  style={{ transform: `scaleX(${pct / 100})` }}
                />
                <div className="relative flex items-center justify-between px-3 py-2.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isVoted && (
                      <CheckCircle className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                    )}
                    {isLeading && !isVoted && (
                      <span className="text-xs flex-shrink-0">⭐</span>
                    )}
                    <span className={cn(
                      "text-xs font-semibold truncate",
                      isVoted ? "text-[#E50914]" : isLeading ? "text-emerald-400" : "text-gray-300"
                    )}>
                      {option.text}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs font-black flex-shrink-0",
                    isVoted ? "text-[#E50914]" : isLeading ? "text-emerald-400" : "text-gray-500"
                  )}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          }

          // Voting state — show clickable buttons
          return (
            <button
              key={option.id}
              onClick={() => !voting && onVote(poll.id, option.id)}
              disabled={voting}
              className={cn(
                "w-full text-left rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all",
                "border-[#1E1E2A] bg-[#111118] text-gray-300",
                "hover:border-[#E50914]/50 hover:bg-[#E50914]/8 hover:text-white",
                "active:scale-[0.98]",
                voting && "opacity-50 cursor-not-allowed"
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      {!hasVoted && !isEnded && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-gray-600 text-center">
            Clica para votar · Um voto por sondagem
          </p>
        </div>
      )}

      {isEnded && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-gray-600 text-center">
            Sondagem encerrada · {formatNumber(poll.totalVotes)} votos
          </p>
        </div>
      )}
    </div>
  );
}
